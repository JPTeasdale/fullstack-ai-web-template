import { createInvitation, getOrganizationInvitations } from '$lib/models/invitations';
import { createValidatedApiHandler, createApiHandler, requireAuth } from '$lib/server/api/helpers';
import { successResponse, createdResponse } from '$lib/server/api/response';
import { inviteMemberSchema } from '$lib/schemas/organizations';
import { getInviteToOrgTemplate } from '$lib/email/templates/invite_to_org';

export const GET = createApiHandler(async (event) => {
	const { orgId } = event.params;
	
	await requireAuth(event);

	// Create org context
	const ctx = {
		...event.locals,
		user: event.locals.user!,
		organizationId: orgId!
	};

	const invitations = await getOrganizationInvitations(ctx);

	return successResponse(invitations);
});

export const POST = createValidatedApiHandler(
	inviteMemberSchema,
	async (event) => {
		const { orgId } = event.params;
		const data = event.validated;
		
		await requireAuth(event);

		// Create org context - RLS will handle permission check
		const ctx = {
			...event.locals,
			user: event.locals.user!,
			organizationId: orgId!
		};

		const { invitation, organization } = await createInvitation(ctx, data);

		// Send email (non-blocking)
		getInviteToOrgTemplate({
			inviteLink: `${event.url.origin}/invitations`,
			orgName: organization.name,
			email: data.email,
			inviterName: event.locals.user?.email || '',
		});

		return createdResponse({ success: true, invitation });
	}
); 

