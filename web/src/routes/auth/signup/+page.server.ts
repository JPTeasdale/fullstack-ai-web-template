import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { URL_VERIFY_MAGIC_LINK } from '$lib/url';
import { createValidatedActionHandler, actionSuccess } from '$lib/server/actions/helpers';
import { z } from 'zod';
import { OperationError } from '$lib/errors';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) {
		throw redirect(303, '/');
	}
};

const signupSchema = z
	.object({
		email: z.string().email('Please enter a valid email address'),
		password: z.string().min(6, 'Password must be at least 6 characters long'),
		'confirm-password': z.string()
	})
	.refine((data) => data.password === data['confirm-password'], {
		message: 'Passwords do not match',
		path: ['confirm-password']
	});

export const actions: Actions = {
	signup: createValidatedActionHandler(signupSchema, async ({ body, ctx, url }) => {
		const { email, password } = body;
		const { supabase } = ctx;

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${url.origin}${URL_VERIFY_MAGIC_LINK}`
			}
		});

		if (error) {
			throw new OperationError(error.message, 'auth.signup');
		}

		// If user already exists but is not confirmed, tell them to check email
		if (data.user && !data.session) {
			return actionSuccess(
				{ email },
				'Please check your email and click the confirmation link to complete your registration.'
			);
		}

		// If signup was successful and user is immediately signed in
		if (data.session) {
			throw redirect(303, '/');
		}

		// Default success message
		return actionSuccess(
			{ email },
			'Account created successfully! Please check your email to confirm your account.'
		);
	})
};
