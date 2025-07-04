import { updateMemberRole, removeMember } from '$lib/server/models/members';
import { createValidatedOrganizationApiHandler, createOrganizationApiHandler } from '$lib/server/api/helpers';
import { successResponse, noContentResponse } from '$lib/server/api/response';
import { updateMemberRoleSchema } from '$lib/schemas/organizations';

export const PATCH = createValidatedOrganizationApiHandler(updateMemberRoleSchema, async (event) => {
	const { organizationId } = event;
	const { memberId } = event.params;
	const { role } = event.validated;

	await updateMemberRole(event, organizationId, memberId!, role);

	return successResponse({ success: true });
});

export const DELETE = createOrganizationApiHandler(async (event) => {
	const { organizationId } = event;
	const { memberId } = event.params;

	await removeMember(event, organizationId, memberId!);

	return noContentResponse();
});
