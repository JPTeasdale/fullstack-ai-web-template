import { NotFoundError, OperationError, ConflictError, ValidationError } from '$lib/errors';
import type { OrgContext, AuthenticatedContext } from '$lib/models/context';
import type { Database } from '$lib/types/generated/supabase.types';
import type { InviteMemberData } from '$lib/schemas/organizations';

type InvitationStatus = Database['public']['Enums']['invitation_status'];

/**
 * Get all invitations for an organization
 * RLS ensures users can only see invitations for their organizations
 */
export const getOrganizationInvitations = async (ctx: OrgContext) => {
	const { supabase, organizationId } = ctx;

	const { data: invitations, error } = await supabase
		.from('invitations')
		.select('*')
		.eq('organization_id', organizationId)
		.eq('status', 'pending')
		.order('created_at', { ascending: false });

	if (error) {
		throw new OperationError(`Failed to fetch invitations: ${error.message}`, 'database.fetch', {
			orgId: organizationId,
			errorCode: error.code
		});
	}

	return invitations || [];
};

/**
 * Create an invitation to join an organization
 * RLS ensures only members can create invitations
 */
export const createInvitation = async (ctx: OrgContext, data: InviteMemberData) => {
	const { supabase, organizationId, user } = ctx;

	// Get organization for name
	const { data: organization } = await supabase
		.from('organizations')
		.select('name')
		.eq('id', organizationId)
		.single();

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
			role: data.role,
			organization_id: organizationId,
			invited_by: user.id,
			status: 'pending',
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
		})
		.select()
		.single();

	if (error) {
		if (error.code === '23505') {
			// Unique constraint violation
			throw new ConflictError('An invitation already exists for this email', 'duplicate');
		}
		throw new OperationError(`Failed to create invitation: ${error.message}`, 'database.insert', {
			orgId: organizationId,
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
export const cancelInvitation = async (ctx: OrgContext, invitationId: string) => {
	const { supabase, organizationId } = ctx;

	// Update invitation status
	const { error } = await supabase
		.from('invitations')
		.update({
			status: 'declined',
			updated_at: new Date().toISOString()
		})
		.eq('id', invitationId)
		.eq('organization_id', organizationId)
		.eq('status', 'pending');

	if (error) {
		throw new OperationError(`Failed to cancel invitation: ${error.message}`, 'database.update', {
			invitationId,
			orgId: organizationId,
			errorCode: error.code
		});
	}

	return { success: true };
};

/**
 * Accept an invitation
 * Database function handles validation and adding user to organization
 */
export const acceptInvitation = async (ctx: AuthenticatedContext, token: string) => {
	const { supabase } = ctx;

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
export const getUserInvitations = async (ctx: AuthenticatedContext) => {
	const { supabase, user } = ctx;

	// Get user email
	const { data: profile } = await supabase
		.from('user_profiles')
		.select('email')
		.eq('user_id', user.id)
		.single();

	if (!profile?.email) {
		return [];
	}

	const { data: invitations, error } = await supabase
		.from('invitations')
		.select(
			`
            *,
            organizations!inner(
                name,
                slug,
                logo_url
            )
        `
		)
		.eq('email', profile.email)
		.eq('status', 'pending')
		.gt('expires_at', new Date().toISOString())
		.order('created_at', { ascending: false });

	if (error) {
		throw new OperationError(
			`Failed to fetch user invitations: ${error.message}`,
			'database.fetch',
			{ userId: user.id, errorCode: error.code }
		);
	}

	return invitations || [];
};
