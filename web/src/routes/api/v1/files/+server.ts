import { uploadFile } from '$lib/server/services/fileService';
import { createAuthenticatedApiHandler, parseFileUpload } from '$lib/server/api/helpers';
import { createdResponse } from '$lib/server/api/response';

export const POST = createAuthenticatedApiHandler(async (event) => {
	// Parse file from FormData
	const file = await parseFileUpload(event.request);

	const result = await uploadFile(event, 'user', event.locals.user.id, file, {
		uploadToOpenAI: true
	});

	return createdResponse(result);
});
