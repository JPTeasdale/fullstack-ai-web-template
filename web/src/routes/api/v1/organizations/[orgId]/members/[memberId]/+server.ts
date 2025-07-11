import { updateMemberRole, removeMember } from '$lib/server/models/members';
import { createOrganizationApiHandler, validateApi } from '$lib/server/helpers/api_helpers';
import { successResponse, noContentResponse } from '$lib/server/helpers/response';
import { updateMemberRoleSchema } from '$lib/schemas/organizations';

export const PATCH = createOrganizationApiHandler(async (event) => {
	const { organizationId } = event;
	const { memberId } = event.params;
	const { role } = await validateApi(updateMemberRoleSchema, event);

	await updateMemberRole(event, organizationId, memberId!, role);

	return successResponse({ success: true });
});

export const DELETE = createOrganizationApiHandler(async (event) => {
	const { organizationId } = event;
	const { memberId } = event.params;

	await removeMember(event, organizationId, memberId!);

	return noContentResponse();
});
