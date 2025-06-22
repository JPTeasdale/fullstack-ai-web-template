import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase }, params }) => {
	const { orgId } = params;

	// Fetch organization members with user profile information
	const { data: members, error } = await supabase
		.from('organization_members')
		.select(
			`
			*,
			user_profiles!organization_members_user_id_fkey!inner(
				user_id,
				email,
				full_name,
				display_name,
				avatar_url
			)
		`
		)
		.eq('organization_id', orgId)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching members:', error);
	}

	const { data: invitations } = await supabase
		.from('invitations')
		.select('*')
		.eq('organization_id', orgId)
		.eq('status', 'pending')
		.order('created_at', { ascending: false });

	return {
		members: members || [],
		invitations: invitations || [],
		canManageMembers: true
	};
};
