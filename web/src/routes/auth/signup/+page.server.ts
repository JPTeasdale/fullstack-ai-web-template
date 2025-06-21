import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { errorStr } from '$lib/utils/error';
import { URL_VERIFY_MAGIC_LINK } from '$lib/url';

export const load: PageServerLoad = async ({ locals: { session } }) => {
	if (session) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	signup: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirm-password') as string;

		// Basic validation
		if (!email || !password || !confirmPassword) {
			return fail(400, {
				error: 'Email, password, and password confirmation are required',
				email
			});
		}

		if (!email.includes('@')) {
			return fail(400, {
				error: 'Please enter a valid email address',
				email
			});
		}

		if (password.length < 6) {
			return fail(400, {
				error: 'Password must be at least 6 characters long',
				email
			});
		}

		if (password !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match',
				email
			});
		}

		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${url.origin}${URL_VERIFY_MAGIC_LINK}`
				}
			});

			if (error) {
				return fail(400, {
					error: errorStr(error),
					email
				});
			}

			// If user already exists but is not confirmed, tell them to check email
			if (data.user && !data.session) {
				return {
					success: true,
					message:
						'Please check your email and click the confirmation link to complete your registration.',
					email
				};
			}

			// If signup was successful and user is immediately signed in
			if (data.session) {
				throw redirect(303, '/');
			}

			// Default success message
			return {
				success: true,
				message: 'Account created successfully! Please check your email to confirm your account.',
				email
			};
		} catch (error) {
			return fail(500, {
				error: 'An unexpected error occurred. Please try again.',
				email
			});
		}
	}
};
