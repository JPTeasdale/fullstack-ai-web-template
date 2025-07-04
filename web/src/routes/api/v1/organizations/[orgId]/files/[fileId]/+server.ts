import { deleteFile, getFileDownload } from '$lib/server/services/fileService';
import { createOrganizationApiHandler } from '$lib/server/api/helpers';
import { fileDownloadResponse, noContentResponse } from '$lib/server/api/response';
import { ConfigurationError } from '$lib/server/errors';

export const GET = createOrganizationApiHandler(async (event) => {
	const { fileId } = event.params;

	if (!fileId) {
		throw new ConfigurationError('File ID is required');
	}

	const { file, object } = await getFileDownload(event, fileId);

	return fileDownloadResponse(object.body, file.name, file.mime_type, file.size);
});

export const DELETE = createOrganizationApiHandler(async (event) => {
	const { fileId } = event.params;

	if (!fileId) {
		throw new ConfigurationError('File ID is required');
	}

	await deleteFile(event, fileId);

	return noContentResponse();
});
