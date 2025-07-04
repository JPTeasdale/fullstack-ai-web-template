import { uploadFile } from '$lib/server/services/fileService';
import { createOrganizationApiHandler, parseFileUpload } from '$lib/server/api/helpers';
import { createdResponse } from '$lib/server/api/response';

export const POST = createOrganizationApiHandler(async (event) => {
	// Parse file from FormData
	const file = await parseFileUpload(event.request);

	const result = await uploadFile(event, 'organization', event.organizationId, file, {
		uploadToOpenAI: true
	});

	return createdResponse(result);
});
