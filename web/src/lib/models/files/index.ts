import { NotFoundError, OperationError, ServiceUnavailableError } from '$lib/errors';
import type { BaseContext, AuthenticatedContext } from '$lib/models/context';
import { createFileUploadKey } from '$lib/utils/fileUpload';
import { FileUploadService } from '$lib/services/fileUploadService';

/**
 * Get a file from an organization
 */
export const getOrganizationFile = async (ctx: BaseContext, id: string) => {
	const { supabase, r2 } = ctx;

	// Fetch file metadata
	const { data: file, error: fileError } = await supabase
		.from('files')
		.select('*')
		.eq('id', id)
		.single();

	if (fileError) {
		if (fileError.code === 'PGRST116') {
			// Row not found
			throw new NotFoundError('File');
		}
		throw new OperationError(`Failed to fetch file: ${fileError.message}`, 'database.fetch', {
			fileId: id,
			errorCode: fileError.code
		});
	}

	if (!file) {
		throw new NotFoundError('File');
	}

	// Get file from R2
	const key = createFileUploadKey({
		id: file.id,
		organization_id: file.organization_id
	});

	try {
		const object = await r2.get(key);

		if (!object) {
			throw new NotFoundError('File data');
		}

		return {
			file,
			body: object.body,
			headers: {
				'Content-Type': file.mime_type,
				'Content-Disposition': `attachment; filename="${file.name}"`,
				'Content-Length': file.size.toString()
			}
		};
	} catch (err) {
		if (err instanceof NotFoundError) {
			throw err;
		}
		throw new ServiceUnavailableError(
			'R2 Storage',
			`Failed to retrieve from R2: ${err instanceof Error ? err.message : 'Unknown error'}`
		);
	}
};

/**
 * Create a new file in an organization
 */
export const createOrganizationFile = async (
	ctx: AuthenticatedContext,
	orgId: string,
	file: File
) => {
	const uploadService = new FileUploadService(ctx);
	return uploadService.uploadFile(file, orgId);
};

/**
 * Delete a file from an organization
 */
export const deleteOrganizationFile = async (ctx: BaseContext, id: string) => {
	// We need authenticated context for deletion
	const authCtx = ctx as AuthenticatedContext;
	const uploadService = new FileUploadService(authCtx);

	await uploadService.deleteFile(id);

	return { success: true };
};
