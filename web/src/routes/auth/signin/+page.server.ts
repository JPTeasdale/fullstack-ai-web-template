import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { errorStr } from '$lib/utils/error';
import { URL_DASHBOARD } from '$lib/url';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	signin: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		// Basic validation
		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required',
				email
			});
		}

		if (!email.includes('@')) {
			return fail(400, {
				error: 'Please enter a valid email address',
				email
			});
		}

		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) {
				return fail(400, {
					error: errorStr(error),
					email
				});
			}

			if (!data.session) {
				return fail(400, {
					error: 'Failed to create session',
					email
				});
			}

			// Session is established successfully - cookies will be set by the Supabase client
			// No need to verify again since we have valid session data from signInWithPassword
		} catch (error) {
			return fail(500, {
				error: 'An unexpected error occurred. Please try again.',
				email
			});
		}

		// Redirect to the intended page or home
		const redirectTo = url.searchParams.get('redirectTo') ?? URL_DASHBOARD;
		throw redirect(303, redirectTo);
	}
};
