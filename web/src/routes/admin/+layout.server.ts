import { assertAuthenticated } from '$lib/server/api/context';
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async (event) => {
	assertAuthenticated(event);
	const { supabaseAdmin } = event.locals;

	const { data: userData } = await supabaseAdmin
		.from('user_private')
		.select('is_admin')
		.eq('user_id', event.locals.user.id)
		.single();

	console.log({ userData });

	if (!userData?.is_admin) {
		throw error(404, 'Not Found');
	}

	return {};
};
