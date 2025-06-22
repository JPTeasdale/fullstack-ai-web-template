import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Database } from '$lib/types/generated/supabase.types';

type MemberRole = Database['public']['Enums']['member_role'];

export const PATCH: RequestHandler = async ({ locals: { supabase }, params, request }) => {
	const { orgId, memberId } = params;
	const { role } = await request.json() as { role: MemberRole };

	// Get current user
	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	// Check if current user has permission (must be admin or owner)
	const { data: currentMember } = await supabase
		.from('organization_members')
		.select('role')
		.eq('organization_id', orgId)
		.eq('user_id', user.id)
		.single();

	if (!currentMember || (currentMember.role !== 'admin' && currentMember.role !== 'owner')) {
		return json({ message: 'You do not have permission to update member roles' }, { status: 403 });
	}

	// Check if target member exists and get their current role
	const { data: targetMember } = await supabase
		.from('organization_members')
		.select('role, user_id')
		.eq('id', memberId)
		.eq('organization_id', orgId)
		.single();

	if (!targetMember) {
		return json({ message: 'Member not found' }, { status: 404 });
	}

	// Prevent changing owner role
	if (targetMember.role === 'owner') {
		return json({ message: 'Cannot change the role of the organization owner' }, { status: 403 });
	}

	// Prevent non-owners from making someone else an admin
	if (role === 'admin' && currentMember.role !== 'owner') {
		return json({ message: 'Only owners can assign admin roles' }, { status: 403 });
	}

	// Update the member's role
	const { error: updateError } = await supabase
		.from('organization_members')
		.update({ role })
		.eq('id', memberId)
		.eq('organization_id', orgId);

	if (updateError) {
		console.error('Failed to update member role:', updateError);
		return json({ message: 'Failed to update member role' }, { status: 500 });
	}

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals: { supabase }, params }) => {
	const { orgId, memberId } = params;

	// Get current user
	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) {
		return json({ message: 'Unauthorized' }, { status: 401 });
	}

	// Check if current user has permission (must be admin or owner)
	const { data: currentMember } = await supabase
		.from('organization_members')
		.select('role')
		.eq('organization_id', orgId)
		.eq('user_id', user.id)
		.single();

	if (!currentMember || (currentMember.role !== 'admin' && currentMember.role !== 'owner')) {
		return json({ message: 'You do not have permission to remove members' }, { status: 403 });
	}

	// Check if target member exists and get their role
	const { data: targetMember } = await supabase
		.from('organization_members')
		.select('role, user_id')
		.eq('id', memberId)
		.eq('organization_id', orgId)
		.single();

	if (!targetMember) {
		return json({ message: 'Member not found' }, { status: 404 });
	}

	// Prevent removing the owner
	if (targetMember.role === 'owner') {
		return json({ message: 'Cannot remove the organization owner' }, { status: 403 });
	}

	// Prevent admins from removing other admins
	if (targetMember.role === 'admin' && currentMember.role !== 'owner') {
		return json({ message: 'Only owners can remove admins' }, { status: 403 });
	}

	// Remove the member
	const { error: deleteError } = await supabase
		.from('organization_members')
		.delete()
		.eq('id', memberId)
		.eq('organization_id', orgId);

	if (deleteError) {
		console.error('Failed to remove member:', deleteError);
		return json({ message: 'Failed to remove member' }, { status: 500 });
	}

	return json({ success: true });
}; 