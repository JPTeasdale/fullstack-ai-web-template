import { getOrganizationInvitations } from '$lib/server/models/invitations';
import { validateApi, createOrganizationApiHandler } from '$lib/server/helpers/api_helpers';
import { successResponse, createdResponse } from '$lib/server/helpers/response';
import { inviteMemberSchema } from '$lib/schemas/organizations';
import { inviteToOrg } from '$lib/server/models/invitations/invite_to_org';

export const GET = createOrganizationApiHandler(async (event) => {
	const invitations = await getOrganizationInvitations(event, event.organizationId);
	return successResponse(invitations);
});

export const POST = createOrganizationApiHandler(async (event) => {
	const validated = await validateApi(inviteMemberSchema, event);
	await inviteToOrg(event, event.organizationId, validated);
	return createdResponse({ success: true });
});
