import { getOrganizationInvitations } from '$lib/server/models/invitations';
import {
	createValidatedOrganizationApiHandler,
	createOrganizationApiHandler
} from '$lib/server/api/helpers';
import { successResponse, createdResponse } from '$lib/server/api/response';
import { inviteMemberSchema } from '$lib/schemas/organizations';
import { extractOrganizationId } from '$lib/server/api/context';
import { inviteToOrg } from '$lib/server/models/invitations/invite_to_org';

export const GET = createOrganizationApiHandler(async (event) => {
	const orgId = extractOrganizationId(event);

	const invitations = await getOrganizationInvitations(event, orgId);

	return successResponse(invitations);
});

export const POST = createValidatedOrganizationApiHandler(inviteMemberSchema, async (event) => {
	const organizationId = extractOrganizationId(event);

	await inviteToOrg(event, organizationId, event.validated);

	return createdResponse({ success: true });
});
