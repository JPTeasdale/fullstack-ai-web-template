import { OperationError } from '$lib/server/errors';
import type { RequestEvent } from '@sveltejs/kit';
import { generateConfirmationURL } from './auth_utils';
import { getInviteGenericTemplate } from '$lib/email/templates/invite_generic';

export async function inviteToJoin(event: RequestEvent, email: string) {
	const { supabaseAdmin, emailService } = event.locals;
	const { data, error } = await supabaseAdmin.auth.admin.generateLink({
		type: 'invite',
		email
	});

	if (error) {
		throw new OperationError(error.message, 'auth.signup');
	}

	const inviteLink = generateConfirmationURL({
		baseUrl: event.url.origin,
		token_hash: data.properties.hashed_token,
		email_action_type: 'invite',
		redirect_to: event.url.origin
	});

	const emailTemplate = getInviteGenericTemplate({
		inviteLink,
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
