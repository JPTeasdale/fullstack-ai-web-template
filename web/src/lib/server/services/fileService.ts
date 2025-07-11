import {
	NotFoundError,
	OperationError,
	ServiceUnavailableError,
	ValidationError,
	PayloadTooLargeError
} from '$lib/server/errors';
import { extractR2, type AuthenticatedEvent } from '$lib/server/helpers/event';
import { getStreamFromFile } from '$lib/server/services/cloudflare/getStreamFromFile';
import { isImageFile, isDocumentFile, FILE_TYPES } from '$lib/schemas/files';
import type { Tables } from '$lib/types/generated/supabase.types';
import { errorStr } from '$lib/utils/error';

export function createFileUploadKey(fileUpload: Pick<Tables<'files'>, 'id'>) {
	return `file_uploads/${fileUpload.id}`;
}

export function getFileUploadIdFromKey(key: string): string {
	return key.split('/').pop()!;
}

type AppFile = Tables<'files'>;

interface FileUploadResult {
	fileId: string;
	openaiFileId?: string | null;
}

export async function addFileToUserVectorStore(
	event: AuthenticatedEvent,
	userId: string,
	openaiFileId: string
) {
	const { supabaseAdmin, openai } = event.locals;

	const { data: user, error: userError } = await supabaseAdmin
		.from('user_private')
		.select('user_id, openai_vector_store_id')
		.eq('id', userId)
		.single();

	if (userError) {
		throw new OperationError(`Failed to fetch user: ${userError.message}`, 'database.fetch', {
			userId,
			errorCode: userError.code
		});
	}

	if (!user) {
		throw new NotFoundError('User');
	}

	if (user.openai_vector_store_id) {
		await openai.vectorStores.files.create(user.openai_vector_store_id, {
			file_id: openaiFileId
		});
		return user.openai_vector_store_id;
	}

	const store = await openai.vectorStores.create({
		name: `User: ${user.user_id}`,
		file_ids: [openaiFileId]
	});

	await supabaseAdmin
		.from('user_private')
		.update({ openai_vector_store_id: store.id })
		.eq('id', userId);

	return store.id;
}

export async function addFileToOrganizationVectorStore(
	event: AuthenticatedEvent,
	organizationId: string,
	openaiFileId: string
) {
	const { supabaseAdmin, openai } = event.locals;

	const { data: organization, error: organizationError } = await supabaseAdmin
		.from('organization_private')
		.select('organization_id, openai_vector_store_id')
		.eq('organization_id', organizationId)
		.single();

	if (organizationError) {
		throw new OperationError(
			`Failed to fetch organization: ${organizationError.message}`,
			'database.fetch',
			{
				organizationId,
				errorCode: organizationError.code
			}
		);
	}

	if (!organization) {
		throw new NotFoundError('Organization');
	}

	if (organization.openai_vector_store_id) {
		await openai.vectorStores.files.create(organization.openai_vector_store_id, {
			file_id: openaiFileId
		});
		return organization.openai_vector_store_id;
	}

	const store = await openai.vectorStores.create({
		name: `Organization: ${organization.organization_id}`,
		file_ids: [openaiFileId]
	});
	console.log('Created OpenAI vector store', store);

	const { error: updateError } = await supabaseAdmin
		.from('organization_private')
		.update({ openai_vector_store_id: store.id })
		.eq('organization_id', organizationId);

	console.log('Updated organization private', updateError);

	return store.id;
}

/**
 * Upload a file to storage and optionally to OpenAI
 */
export async function uploadFile(
	event: AuthenticatedEvent,
	scope: 'user' | 'organization',
	ownerId: string,
	file: File,
	options: {
		maxSize?: number;
		allowedTypes?: string[];
		uploadToOpenAI?: boolean;
	}
): Promise<FileUploadResult> {
	const r2 = extractR2(event);
	const { supabase, openai, user } = event.locals;

	// Validate file
	const { contentType, isImage, isDocument } = await validateFile(file, {
		maxSize: options.maxSize,
		allowedTypes: options.allowedTypes,
		uploadToOpenAI: options.uploadToOpenAI
	});

	// Create file record
	const { data: fileUpload, error: fileUploadError } = await supabase
		.from('files')
		.insert({
			user_id: scope === 'user' ? ownerId : null,
			organization_id: scope === 'organization' ? ownerId : null,
			name: file.name,
			mime_type: file.type,
			is_public: false,
			size: file.size
		})
		.select('id,organization_id')
		.single();

	if (fileUploadError || !fileUpload) {
		throw new OperationError(
			`Failed to create file upload record: ${fileUploadError?.message || 'Unknown error'}`,
			'database.insert',
			{ scope, ownerId, fileName: file.name, errorCode: fileUploadError?.code }
		);
	}

	try {
		// Upload to R2
		const [_, uploadStream] = file.stream().tee();
		const key = createFileUploadKey(fileUpload);
		const body = await getStreamFromFile(uploadStream, file.size);
		const r2Promise = r2.put(key, body);

		// Upload to OpenAI if applicable
		let openaiFileId: string | null = null;
		if (options.uploadToOpenAI && isDocument) {
			console.log('Uploading to OpenAI', file.name, file.type, file.size);
			const openaiFile = await openai.files.create({
				purpose: 'user_data',
				file
			});

			openaiFileId = openaiFile.id;
			if (scope === 'user') {
				await addFileToUserVectorStore(event, ownerId, openaiFileId);
			} else {
				console.log('Adding file to organization vector store', ownerId, openaiFileId);
				await addFileToOrganizationVectorStore(event, ownerId, openaiFileId);
			}
		}

		try {
			await r2Promise;
		} catch (err) {
			throw new ServiceUnavailableError('R2 Storage', `Failed to upload to R2: ${errorStr(err)}`);
		}

		await markFileAsReady(event, fileUpload.id, openaiFileId);

		return { fileId: fileUpload.id, openaiFileId };
	} catch (err) {
		// If upload fails, try to clean up the database record
		await cleanupFailedUpload(event, fileUpload.id);

		if (
			err instanceof ServiceUnavailableError ||
			err instanceof ValidationError ||
			err instanceof PayloadTooLargeError
		) {
			throw err;
		}

		throw new ServiceUnavailableError(
			'File Storage',
			`Failed to upload file: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
}

async function markFileAsReady(
	event: AuthenticatedEvent,
	fileId: string,
	openaiFileId: string | null
) {
	const { supabaseAdmin } = event.locals;
	// Mark file as ready
	const { error: updateError } = await supabaseAdmin
		.from('files')
		.update({
			is_ready: true,
			openai_file_id: openaiFileId
		})
		.eq('id', fileId);

	if (updateError) {
		console.error('Failed to mark file as ready:', updateError);
		// Non-critical error, file is still uploaded
	}
}

function validateFile(
	file: File,
	options: {
		maxSize?: number;
		allowedTypes?: string[];
		uploadToOpenAI?: boolean;
	}
) {
	const maxSize = options.maxSize || 50 * 1024 * 1024; // 50MB default
	// Validate file
	const contentType = file.type;
	if (!contentType) {
		throw new ValidationError('File contentType could not be determined');
	}

	// Check file size
	if (file.size > maxSize) {
		throw new PayloadTooLargeError(maxSize, file.size);
	}

	// Validate file type
	if (options.allowedTypes) {
		if (!options.allowedTypes.includes(contentType)) {
			throw new ValidationError(
				`Unsupported file type. Allowed types: ${options.allowedTypes.join(', ')}`
			);
		}
	}
	// Default validation
	const isImage = isImageFile(contentType);
	const isDocument = isDocumentFile(contentType);

	if (!isImage && !isDocument) {
		throw new ValidationError(
			`Unsupported file type. Allowed types: ${[...FILE_TYPES.images, ...FILE_TYPES.documents].join(', ')}`
		);
	}

	return { contentType, isImage, isDocument };
}

export async function getFileDownload(
	event: AuthenticatedEvent,
	fileId: string
): Promise<{ file: AppFile; object: R2ObjectBody }> {
	const { supabase } = event.locals;

	// Fetch file metadata
	const { data: file, error: fileError } = await supabase
		.from('files')
		.select('*')
		.eq('id', fileId)
		.single();

	console.log({
		fileError,
		file,
		fileId
	});

	if (fileError) {
		if (fileError.code === 'PGRST116') {
			// Row not found
			throw new NotFoundError('File');
		}
		throw new OperationError(`Failed to fetch file: ${fileError.message}`, 'database.fetch', {
			fileId,
			errorCode: fileError.code
		});
	}

	if (!file) {
		throw new NotFoundError('File');
	}

	const r2 = extractR2(event);
	const key = createFileUploadKey(file);
	const object = await r2.get(key);

	if (!object) {
		throw new NotFoundError('File data');
	}

	return { file, object };
}

/**
 * Clean up failed upload
 */
async function cleanupFailedUpload(event: AuthenticatedEvent, fileId: string): Promise<void> {
	const { supabase } = event.locals;

	try {
		await supabase.from('files').delete().eq('id', fileId);
	} catch (err) {
		console.error('Failed to clean up file record:', err);
	}
}

/**
 * Delete a file from all storage providers
 */
export async function deleteFile(event: AuthenticatedEvent, fileId: string): Promise<void> {
	const { supabase, openai } = event.locals;
	const r2 = extractR2(event);

	// Fetch file metadata
	const { data: file, error: fileError } = await supabase
		.from('files')
		.select('*')
		.eq('id', fileId)
		.single();

	if (fileError) {
		if (fileError.code === 'PGRST116') {
			// Row not found
			throw new NotFoundError('File');
		}
		throw new OperationError(`Failed to fetch file: ${fileError.message}`, 'database.fetch', {
			fileId,
			errorCode: fileError.code
		});
	}

	if (!file) {
		throw new NotFoundError('File');
	}

	// Delete from storage providers in parallel
	const deletions: Promise<any>[] = [];

	// Delete from R2
	const key = createFileUploadKey(file);
	deletions.push(
		r2.delete(key).catch((err) => {
			throw new ServiceUnavailableError(
				'R2 Storage',
				`Failed to delete from R2: ${err instanceof Error ? err.message : 'Unknown error'}`
			);
		})
	);

	// Delete from OpenAI if applicable
	if (file.openai_file_id) {
		deletions.push(
			openai.files.delete(file.openai_file_id).catch((err) => {
				console.warn('Failed to delete file from OpenAI', err);
				// Non-critical error
			})
		);
	}

	// Wait for deletions
	await Promise.all(deletions);

	// Delete from database
	const { error: deleteError } = await supabase.from('files').delete().eq('id', fileId);

	if (deleteError) {
		throw new OperationError(
			`Failed to delete from database: ${deleteError.message}`,
			'database.delete',
			{ fileId, errorCode: deleteError.code }
		);
	}
}
