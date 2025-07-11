import { uploadFile } from '$lib/server/services/fileService';
import { createAuthenticatedApiHandler, parseFileUpload } from '$lib/server/helpers/api_helpers';
import { createdResponse } from '$lib/server/helpers/response';

export const POST = createAuthenticatedApiHandler(async (event) => {
	// Parse file from FormData
	const file = await parseFileUpload(event.request);

	const result = await uploadFile(event, 'user', event.locals.user.id, file, {
		uploadToOpenAI: true
	});

	return createdResponse(result);
});
