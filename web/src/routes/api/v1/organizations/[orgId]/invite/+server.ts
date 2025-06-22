import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Database } from '$lib/types/generated/supabase.types';

type MemberRole = Database['public']['Enums']['member_role'];

export const POST: RequestHandler = async ({ locals: { supabase }, params, request }) => {
	const { orgId } = params;
	const { email, role } = await request.json() as { email: string; role: MemberRole };

	// Validate inputs
	if (!email || !role) {
		return json({ message: 'Email and role are required' }, { status: 400 });
	}

	if (!['member', 'admin'].includes(role)) {
		return json({ message: 'Invalid role' }, { status: 400 });
	}

	// Get current user
	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	// Check if current user has permission to invite (must be admin or owner)
	const { data: currentMember } = await supabase
		.from('organization_members')
		.select('role')
		.eq('organization_id', orgId)
		.eq('user_id', user.id)
		.single();

	if (!currentMember || (currentMember.role !== 'admin' && currentMember.role !== 'owner')) {
		return json({ message: 'You do not have permission to invite members' }, { status: 403 });
	}

	// Check if user is already a member
	const { data: existingUser } = await supabase
		.from('user_profiles')
		.select('user_id')
		.eq('email', email)
		.single();

	if (existingUser) {
		const { data: existingMember } = await supabase
			.from('organization_members')
			.select('id')
			.eq('organization_id', orgId)
			.eq('user_id', existingUser.user_id)
			.single();

		if (existingMember) {
			return json({ message: 'This user is already a member of the organization' }, { status: 400 });
		}
	}

	// Check if invitation already exists
	const { data: existingInvite } = await supabase
		.from('invitations')
		.select('id')
		.eq('organization_id', orgId)
		.eq('email', email)
		.eq('status', 'pending')
		.single();

	if (existingInvite) {
		return json({ message: 'An invitation has already been sent to this email' }, { status: 400 });
	}

	// Create invitation
	const { data: invitation, error: inviteError } = await supabase
		.from('invitations')
		.insert({
			email,
			role,
			organization_id: orgId,
			invited_by: user.id,
			status: 'pending',
			expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
		})
		.select()
		.single();

	if (inviteError) {
		console.error('Failed to create invitation:', inviteError);
		return json({ message: 'Failed to create invitation' }, { status: 500 });
	}

	// TODO: Send invitation email
	// This would typically be done through a background job or email service

	return json({ success: true, invitation });
}; 