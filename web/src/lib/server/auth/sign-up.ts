import { OperationError } from '$lib/server/errors';
import type { RequestEvent } from '@sveltejs/kit';
import { getEmailConfirmTemplate } from '$lib/email/templates/email_confirm';
import { generateConfirmationURL } from './auth_utils';

export async function signUpAndSendEmail(event: RequestEvent, email: string, password: string) {
	const { supabaseAdmin, emailService } = event.locals;
	const { data, error } = await supabaseAdmin.auth.admin.generateLink({
		type: 'signup',
		email,
		password
	});

	if (error) {
		throw new OperationError(error.message, 'auth.signup');
	}

	const confirmLink = generateConfirmationURL({
		baseUrl: event.url.origin,
		token_hash: data.properties.hashed_token,
		email_action_type: 'signup',
		redirect_to: event.url.origin
	});

	const emailTemplate = getEmailConfirmTemplate({
		confirmLink,
		email
	});

	try {
		await emailService.sendAuthEmail(
			email,
			emailTemplate.subject,
			emailTemplate.html,
			emailTemplate.text
		);
	} catch (error) {
		console.error('Failed to send sign up email:', error);
		throw new OperationError('Failed to send sign up email', 'auth.signup');
	}

	return data;
}
