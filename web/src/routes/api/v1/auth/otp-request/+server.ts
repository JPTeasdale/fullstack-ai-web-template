import { validateApi, createApiHandler } from '$lib/server/helpers/api_helpers';
import { successResponse } from '$lib/server/helpers/response';
import { z } from 'zod';
import { OperationError } from '$lib/server/errors';
import { getEmailOtpTemplate } from '$lib/email/templates/otp_login_code';

const requestOtpSchema = z.object({
	email: z.string().email()
});

export const POST = createApiHandler(async (event) => {
	const { emailService, supabaseAdmin } = event.locals;
	const { email } = await validateApi(requestOtpSchema, event);

	const { data, error } = await supabaseAdmin.auth.admin.generateLink({
		type: 'magiclink',
		email
	});

	if (error) {
		console.error('Failed to generate OTP code:', error);
		throw new OperationError('Failed to generate otp code', 'auth.otp');
	}

	// Send OTP email
	const emailTemplate = getEmailOtpTemplate({
		token: data.properties.email_otp,
		email,
		appUrl: event.url.origin
	});

	try {
		await emailService.sendAuthEmail(
			email,
			emailTemplate.subject,
			emailTemplate.html,
			emailTemplate.text
		);
	} catch (error) {
		console.error('Failed to send OTP email:', error);
		throw new OperationError('Failed to send OTP email', 'email.send');
	}

	return successResponse({ success: true });
});
