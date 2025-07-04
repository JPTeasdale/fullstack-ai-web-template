import { OperationError } from '$lib/server/errors';
import { createInvitation } from '$lib/server/models/invitations';
import type { InviteMemberData } from '$lib/schemas/organizations';
import type { AuthenticatedEvent } from '$lib/server/api/context';
import { getInviteToOrgTemplate } from '$lib/email/templates/invite_to_org';

export async function inviteToOrg(
	event: AuthenticatedEvent,
	organizationId: string,
	data: InviteMemberData
) {
	const { emailService } = event.locals;

	const { invitation, organization } = await createInvitation(event, organizationId, data);

	if (!invitation) {
		throw new OperationError('Failed to create invitation', 'auth.invite_to_org');
	}

	// Send email (non-blocking)
	const emailTemplate = getInviteToOrgTemplate({
		inviteLink: `${event.url.origin}/invitations/${invitation.id}`,
		orgName: organization.name,
		email: data.email,
		inviterName: event.locals.user?.email || ''
	});

	try {
		await emailService.sendAuthEmail(
			data.email,
			emailTemplate.subject,
			emailTemplate.html,
			emailTemplate.text
		);
	} catch (error) {
		console.error('Failed to send sign up email:', error);
		throw new OperationError('Failed to send sign up email', 'auth.signup');
	}

	return {
		invitation,
		organization
	};
}
