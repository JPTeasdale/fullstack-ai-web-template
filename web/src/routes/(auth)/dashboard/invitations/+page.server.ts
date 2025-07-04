import { acceptInvitation, getUserInvitations } from '$lib/server/models/invitations';
import type { PageServerLoad } from './$types';
import { assertAuthenticated } from '$lib/server/api/context';
import { createValidatedActionHandler } from '$lib/server/actions/helpers';
import { invitationActionSchema } from '$lib/schemas/invitation';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
	assertAuthenticated(event);
	const invitations = await getUserInvitations(event, event.locals.user.id);

	return {
		invitations
	};
};

export const actions = {
	accept: createValidatedActionHandler(invitationActionSchema, async (event) => {
		assertAuthenticated(event);
		const { supabase } = event.locals;

		// Get the invitation to find its token
		const { data: invitation } = await supabase
			.from('invitations')
			.select('token, organization_id')
			.eq('id', event.body.invitationId)
			.single();

		if (!invitation) {
			throw error(404, 'Invitation not found');
		}

		await acceptInvitation(event, invitation.token);

		// Redirect to the organization
		throw redirect(303, `/organizations/${invitation.organization_id}`);
	}),

	decline: createValidatedActionHandler(invitationActionSchema, async (event) => {
		assertAuthenticated(event);
		const { supabase } = event.locals;

		// Update invitation status to declined
		const { error: updateError } = await supabase
			.from('invitations')
			.update({
				status: 'declined',
				updated_at: new Date().toISOString()
			})
			.eq('id', event.body.invitationId);

		if (updateError) {
			throw error(500, 'Failed to decline invitation');
		}

		throw redirect(303, '/invitations');
	})
};
