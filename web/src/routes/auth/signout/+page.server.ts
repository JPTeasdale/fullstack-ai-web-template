import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { session, supabase } }) => {
	if (!session) {
		throw redirect(302, '/');
	}

	await supabase.auth.signOut();

	throw redirect(302, '/');
};
