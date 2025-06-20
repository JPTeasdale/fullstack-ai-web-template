import { APP_NAME } from '$lib/app/constants';
import {
	buildEmailTemplate,
	EmailHeader,
	EmailContent,
	EmailTitle,
	EmailParagraph,
	EmailButton,
	EmailLinkDisplay,
	EmailSmallText,
	EmailFooter,
	EmailContainer
} from '../components';

export type PasswordResetTemplate = {
	siteUrl: string;
	token: string;
	email: string;
};

export function getPasswordResetTemplate({ siteUrl, token, email }: PasswordResetTemplate) {
	const resetLink = `${siteUrl}/auth/reset-password?token=${token}`;

	const html = EmailContainer(
		EmailHeader(APP_NAME, 'Password Reset') +
			EmailContent(
				EmailTitle('Reset Your Password'),
				EmailParagraph('We received a request to reset your password.'),
				EmailParagraph(
					'Click the button below to create a new password. This link will expire in 24 hours.'
				),
				EmailButton('Reset Password', resetLink),
				EmailLinkDisplay(resetLink),
				EmailSmallText(
					`If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.`
				)
			) +
			EmailFooter(email)
	);

	return buildEmailTemplate(`[${APP_NAME}] Reset Your Password`, html);
}
