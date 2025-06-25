import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session } = await safeGetSession();
	const user = session?.user;

	if (!user) {
		redirect(302, '/login');
	}

	const [{data: profile}, {data: organizations}] = await Promise.all([
		supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
		supabase.from('organizations').select('*'),
		supabase.from('invitations').select('*').eq('status', 'pending')
	]);

	return {
		user,
		profile,
		organizations
	};
};
