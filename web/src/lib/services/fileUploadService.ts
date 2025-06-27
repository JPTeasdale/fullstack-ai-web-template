import {
	NotFoundError,
	OperationError,
	ServiceUnavailableError,
	ValidationError,
	PayloadTooLargeError
} from '$lib/errors';
import type { AuthenticatedContext } from '$lib/models/context';
import { createFileUploadKey } from '$lib/utils/fileUpload';
import { getStreamFromFile } from '$lib/cloudflare/getStreamFromFile';
import { isImageFile, isDocumentFile, FILE_TYPES } from '$lib/schemas/files';

interface FileUploadResult {
	fileId: string;
	openaiFileId?: string | null;
}

export class FileUploadService {
	constructor(private ctx: AuthenticatedContext) {}

	/**
	 * Upload a file to storage and optionally to OpenAI
	 */
	async uploadFile(
		file: File,
		orgId: string,
		options: {
			maxSize?: number;
			allowedTypes?: string[];
			uploadToOpenAI?: boolean;
		} = {}
	): Promise<FileUploadResult> {
		const { supabase, supabaseAdmin, openai, r2, user } = this.ctx;
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
		} else {
			// Default validation
			const isImage = isImageFile(contentType);
			const isDocument = isDocumentFile(contentType);

			if (!isImage && !isDocument) {
				throw new ValidationError(
					`Unsupported file type. Allowed types: ${[...FILE_TYPES.images, ...FILE_TYPES.documents].join(', ')}`
				);
			}
		}

		// Get organization if we need to upload to OpenAI
		let organization = null;
		if (options.uploadToOpenAI !== false && isDocumentFile(contentType)) {
			const { data: org, error: orgError } = await supabase
				.from('organizations')
				.select('*')
				.eq('id', orgId)
				.maybeSingle();

			if (orgError) {
				throw new OperationError(
					`Failed to fetch organization: ${orgError.message}`,
					'database.fetch',
					{ orgId, errorCode: orgError.code }
				);
			}

			if (!org) {
				throw new NotFoundError('Organization');
			}

			organization = org;
		}

		// Create file record
		const { data: fileUpload, error: fileUploadError } = await supabase
			.from('files')
			.insert({
				organization_id: orgId,
				name: file.name,
				mime_type: contentType,
				is_public: false,
				size: file.size,
				user_id: user.id
			})
			.select('id,organization_id')
			.single();

		if (fileUploadError || !fileUpload) {
			throw new OperationError(
				`Failed to create file upload record: ${fileUploadError?.message || 'Unknown error'}`,
				'database.insert',
				{ orgId, fileName: file.name, errorCode: fileUploadError?.code }
			);
		}

		try {
			// Prepare uploads
			const uploads: Promise<any>[] = [];

			// Upload to R2
			const [_, uploadStream] = file.stream().tee();
			const key = createFileUploadKey(fileUpload);
			const body = await getStreamFromFile(uploadStream, file.size);
			uploads.push(r2.put(key, body));

			// Upload to OpenAI if applicable
			let openaiFileId: string | null = null;
			if (options.uploadToOpenAI !== false && isDocumentFile(contentType)) {
				uploads.push(
					openai.files
						.create({
							purpose: 'user_data',
							file
						})
						.then((result) => {
							openaiFileId = result.id;
							return result;
						})
				);
			}

			// Execute uploads in parallel
			const results = await Promise.allSettled(uploads);

			// Check R2 upload
			if (results[0].status === 'rejected') {
				throw new ServiceUnavailableError(
					'R2 Storage',
					`Failed to upload to R2: ${results[0].reason}`
				);
			}

			// Handle vector store if OpenAI upload succeeded
			if (openaiFileId && organization) {
				await this.addToVectorStore(openaiFileId, organization, orgId);
			}

			// Mark file as ready
			const { error: updateError } = await supabaseAdmin
				.from('files')
				.update({
					is_ready: true,
					openai_file_id: openaiFileId
				})
				.eq('id', fileUpload.id);

			if (updateError) {
				console.error('Failed to mark file as ready:', updateError);
				// Non-critical error, file is still uploaded
			}

			return { fileId: fileUpload.id, openaiFileId };
		} catch (err) {
			// If upload fails, try to clean up the database record
			await this.cleanupFailedUpload(fileUpload.id);

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

	/**
	 * Add file to organization's vector store
	 */
	private async addToVectorStore(
		openaiFileId: string,
		organization: any,
		orgId: string
	): Promise<void> {
		const { supabase, openai } = this.ctx;

		try {
			if (!organization.openai_vector_store_id) {
				const store = await openai.vectorStores.create({
					name: organization.name,
					file_ids: [openaiFileId]
				});

				await supabase
					.from('organizations')
					.update({ openai_vector_store_id: store.id })
					.eq('id', orgId);
			} else {
				await openai.vectorStores.files.create(organization.openai_vector_store_id, {
					file_id: openaiFileId
				});
			}
		} catch (err) {
			console.error('Failed to add file to vector store:', err);
			// Non-critical error, continue
		}
	}

	/**
	 * Clean up failed upload
	 */
	private async cleanupFailedUpload(fileId: string): Promise<void> {
		const { supabase } = this.ctx;

		try {
			await supabase.from('files').delete().eq('id', fileId);
		} catch (err) {
			console.error('Failed to clean up file record:', err);
		}
	}

	/**
	 * Delete a file from all storage providers
	 */
	async deleteFile(fileId: string): Promise<void> {
		const { supabase, openai, r2 } = this.ctx;

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
}
