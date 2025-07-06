import { updateMemberRole, removeMember } from '$lib/server/models/members';
import { createOrganizationApiHandler, apiValidate } from '$lib/server/api/helpers';
import { successResponse, noContentResponse } from '$lib/server/api/response';
import { updateMemberRoleSchema } from '$lib/schemas/organizations';

export const PATCH = createOrganizationApiHandler(async (event) => {
	const { organizationId } = event;
	const { memberId } = event.params;
	const { role } = await apiValidate(updateMemberRoleSchema, event);

	await updateMemberRole(event, organizationId, memberId!, role);

	return successResponse({ success: true });
});

export const DELETE = createOrganizationApiHandler(async (event) => {
	const { organizationId } = event;
	const { memberId } = event.params;

	await removeMember(event, organizationId, memberId!);

	return noContentResponse();
});
