import { uploadFile } from '$lib/server/services/fileService';
import { assertAuthenticated, extractOrganizationId } from '$lib/server/api/context';
import { createApiHandler, parseFileUpload } from '$lib/server/api/helpers';
import { createdResponse } from '$lib/server/api/response';

export const POST = createApiHandler(async (event) => {
	assertAuthenticated(event);
	// Parse file from FormData
	const file = await parseFileUpload(event.request);

	const result = await uploadFile(event, 'user', event.locals.user.id, file, {
		uploadToOpenAI: true
	});

	return createdResponse(result);
});
