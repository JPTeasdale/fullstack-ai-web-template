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

export type EmailConfirmTemplate = {
	confirmLink: string;
	email: string;
};

export function getEmailConfirmTemplate({ confirmLink, email }: EmailConfirmTemplate) {
	const html = EmailContainer(
		EmailHeader(APP_NAME, 'Confirm Your Email'),
		EmailContent(
			EmailTitle('Welcome to ' + APP_NAME + '! 🎉'),
			EmailParagraph("Thanks for signing up! We're excited to have you join us."),
			EmailParagraph(
				'Click the button to confirm your email address, this helps secure your account.'
			),
			EmailButton('Confirm Email Address', confirmLink),
			EmailLinkDisplay(confirmLink),
			EmailSmallText(`If you didn't sign up for ${APP_NAME}, you can safely ignore this email.`)
		),
		EmailFooter(email)
	);

	return buildEmailTemplate(`[${APP_NAME}] Confirm Your Email`, html);
}
