import { OperationError, ConflictError, NotFoundError } from '$lib/server/errors';
import type { AuthenticatedEvent } from '$lib/server/api/context';
import type { InviteMemberData } from '$lib/schemas/organizations';

/**
 * Get all invitations for an organization
 * RLS ensures users can only see invitations for their organizations
 */
export const getOrganizationInvitations = async (
	event: AuthenticatedEvent,
	organizationId: string
) => {
	const { supabase } = event.locals;

	const { data: invitations, error } = await supabase
		.from('invitations')
		.select('*')
		.eq('organization_id', organizationId)
		.eq('status', 'pending')
		.order('created_at', { ascending: false });

	if (error) {
		throw new OperationError(`Failed to fetch invitations: ${error.message}`, 'database.fetch', {
			organizationId: organizationId,
			errorCode: error.code
		});
	}

	return invitations || [];
};

/**
 * Create an invitation to join an organization
 * RLS ensures only members can create invitations
 */
export const createInvitation = async (
	event: AuthenticatedEvent,
	organizationId: string,
	data: InviteMemberData
) => {
	const { supabase, user } = event.locals;

	// Get organization for name
	const { data: organization } = await supabase
		.from('organizations')
		.select('name')
		.eq('id', organizationId)
		.single();

	if (!organization) {
		throw new NotFoundError('Organization not found');
	}

	// Check if user is already a member
	const { data: existingUser } = await supabase
		.from('user_profiles')
		.select('user_id')
		.eq('email', data.email)
		.single();

	if (existingUser) {
		const { data: existingMember } = await supabase
			.from('organization_members')
			.select('id')
			.eq('organization_id', organizationId)
			.eq('user_id', existingUser.user_id)
			.single();

		if (existingMember) {
			throw new ConflictError(
				'This user is already a member of the organization',
				'duplicate',
				existingMember
			);
		}
	}

	// Check if invitation already exists
	const { data: existingInvite } = await supabase
		.from('invitations')
		.select('id')
		.eq('organization_id', organizationId)
		.eq('email', data.email)
		.eq('status', 'pending')
		.single();

	if (existingInvite) {
		throw new ConflictError(
			'An invitation has already been sent to this email',
			'duplicate',
			existingInvite
		);
	}

	// Create invitation
	const { data: invitation, error } = await supabase
		.from('invitations')
		.insert({
			email: data.email,
			user_id: existingUser?.user_id,
			role: data.role,
			organization_id: organizationId,
			organization_name: organization.name,
			invited_by: user.id,
			status: 'pending',
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
		})
		.select()
		.single();

	if (error) {
		if (error.code === '23505') {
			// Unique constraint violation
			throw new ConflictError('An invitation already exists for this email', 'duplicate');
		}
		throw new OperationError(`Failed to create invitation: ${error.message}`, 'database.insert', {
			organizationId: organizationId,
			errorCode: error.code
		});
	}

	return {
		invitation,
		organization: organization || { name: 'Unknown' }
	};
};

/**
 * Cancel a pending invitation
 * RLS ensures users can only cancel invitations for their organizations
 */
export const cancelInvitation = async (
	event: AuthenticatedEvent,
	organizationId: string,
	invitationId: string
) => {
	const { supabase } = event.locals;

	// Update invitation status
	const { error } = await supabase
		.from('invitations')
		.delete()
		.eq('id', invitationId)
		.eq('organization_id', organizationId)
		.eq('status', 'pending');

	if (error) {
		throw new OperationError(`Failed to cancel invitation: ${error.message}`, 'database.update', {
			invitationId,
			organizationId: organizationId,
			errorCode: error.code
		});
	}

	return { success: true };
};

/**
 * Accept an invitation
 * Database function handles validation and adding user to organization
 */
export const acceptInvitation = async (event: AuthenticatedEvent, token: string) => {
	const { supabase } = event.locals;

	// Use the RPC function to accept invitation
	const { data: success, error } = await supabase.rpc('accept_invitation', {
		invitation_token: token
	});

	if (error || !success) {
		throw new OperationError('Failed to accept invitation', 'invitation.accept', {
			error: error?.message
		});
	}

	return { success: true };
};

/**
 * Get pending invitations for the current user
 */
export const getUserInvitations = async (event: AuthenticatedEvent, userId: string) => {
	const { supabase } = event.locals;

	// Get user email
	const { data: profile } = await supabase
		.from('user_profiles')
		.select('email')
		.eq('user_id', userId)
		.single();

	if (!profile?.email) {
		return [];
	}

	const { data: invitations, error } = await supabase
		.from('invitations')
		.select('*')
		.eq('status', 'pending')
		.gt('expires_at', new Date().toISOString())
		.order('created_at', { ascending: false });

	if (error) {
		throw new OperationError(
			`Failed to fetch user invitations: ${error.message}`,
			'database.fetch',
			{ userId, errorCode: error.code }
		);
	}

	return invitations || [];
};
