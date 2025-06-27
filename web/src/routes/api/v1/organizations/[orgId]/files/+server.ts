import { createOrganizationFile } from '$lib/models/files';
import { createApiHandler, requireAuth, parseFileUpload } from '$lib/server/api/helpers';
import { createdResponse } from '$lib/server/api/response';

export const POST = createApiHandler(async (event) => {
	const { orgId } = event.params;
	
	// Just ensure user is authenticated
	await requireAuth(event);
	
	// Parse file from FormData
	const file = await parseFileUpload(event.request);

	const result = await createOrganizationFile(
		{ ...event.locals, user: event.locals.user! },
		orgId!,
		file
	);

	return createdResponse(result);
});
