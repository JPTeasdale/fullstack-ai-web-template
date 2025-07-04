import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { URL_DASHBOARD } from '$lib/url';
import { createValidatedActionHandler } from '$lib/server/actions/helpers';
import { z } from 'zod';
import { OperationError } from '$lib/server/errors';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) {
		throw redirect(303, '/');
	}
};

const signinSchema = z.object({
	email: z.string().email('Please enter a valid email address'),
	password: z.string().min(1, 'Password is required')
});

export const actions: Actions = {
	signin: createValidatedActionHandler(signinSchema, async ({ body, url, locals }) => {
		const { email, password } = body;
		const { supabase } = locals;

		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			throw new OperationError(error.message, 'auth.signin');
		}

		if (!data.session) {
			throw new OperationError('Failed to create session', 'auth.signin');
		}

		// Session is established successfully - cookies will be set by the Supabase client
		// Redirect to the intended page or home
		const redirectTo = url.searchParams.get('redirectTo') ?? URL_DASHBOARD;
		throw redirect(303, redirectTo);
	})
};
