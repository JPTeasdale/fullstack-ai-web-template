import { uploadFile } from '$lib/server/services/fileService';
import { createOrganizationApiHandler, parseFileUpload } from '$lib/server/helpers/api_helpers';
import { createdResponse } from '$lib/server/helpers/response';

export const POST = createOrganizationApiHandler(async (event) => {
	// Parse file from FormData
	const file = await parseFileUpload(event.request);

	const result = await uploadFile(event, 'organization', event.organizationId, file, {
		uploadToOpenAI: true
	});

	return createdResponse(result);
});
