import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createValidatedActionHandler, actionSuccess } from '$lib/server/actions/helpers';
import { z } from 'zod';
import { signUpAndSendEmail } from '$lib/server/auth/sign-up';

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
	signup: createValidatedActionHandler(signupSchema, async (event) => {
		const {
			body: { email, password }
		} = event;

		await signUpAndSendEmail(event, email, password);

		return actionSuccess(
			{ email },
			'Please check your email and click the confirmation link to complete your registration.'
		);
	})
};
