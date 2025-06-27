import { deleteOrganizationFile, getOrganizationFile } from '$lib/models/files';
import { createApiHandler, requireAuth } from '$lib/server/api/helpers';
import { fileResponse, noContentResponse } from '$lib/server/api/response';

export const GET = createApiHandler(async (event) => {
	const { fileId } = event.params;

	const result = await getOrganizationFile(event.locals, fileId!);

	return fileResponse(result.body, result.file.name, result.file.mime_type, result.file.size);
});

export const DELETE = createApiHandler(async (event) => {
	const { fileId } = event.params;

	// Just ensure user is authenticated
	await requireAuth(event);

	await deleteOrganizationFile(event.locals, fileId!);

	return noContentResponse();
});
