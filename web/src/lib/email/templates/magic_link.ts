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

export type EmailMagicLinkTemplate = {
	magicLink: string;
	email: string;
};

export function getMagicLinkTemplate({ magicLink, email }: EmailMagicLinkTemplate) {
	const html = EmailContainer(
		EmailHeader(APP_NAME, 'Confirm Your Email'),
		EmailContent(
			EmailTitle('Welcome to ' + APP_NAME + '! 🎉'),
			EmailParagraph("Thanks for signing up! We're excited to have you join us."),
			EmailParagraph('Click the button to sign in to your account.'),
			EmailButton('Sign in ✨', magicLink),
			EmailLinkDisplay(magicLink),
			EmailSmallText(`If you didn't try to login, you can safely ignore this email.`)
		),
		EmailFooter(email)
	);

	return buildEmailTemplate(`[${APP_NAME}] Confirm Your Email`, html);
}
