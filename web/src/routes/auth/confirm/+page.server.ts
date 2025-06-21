import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { errorStr } from '$lib/utils/error';
import { URL_DASHBOARD } from '$lib/url';

export const load: PageServerLoad = async ({ url, locals: { supabase } }) => {
	const login = url.searchParams.get('login');

	if (login) {
		url.searchParams.delete('login');
		return { login: decodeURIComponent(login) };
	}

	const token_hash = url.searchParams.get('token_hash');
	const to = url.searchParams.get('to');

	if (!token_hash) {
		return { error: 'Invalid Magic Link' };
	}

	const { data, error } = await supabase.auth.verifyOtp({
		token_hash,
		type: 'email'
	});

	if (error) {
		return { error: errorStr(error) };
	}

	if (data.session) {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session) {
			return { error: 'Failed to set session' };
		}

		await new Promise((resolve) => setTimeout(resolve, 100));

		// The cookies are automatically handled by the supabase client in hooks.server.ts
		throw redirect(303, to ?? URL_DASHBOARD);
	}

	return { error: 'Unknown error' };
};
