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
		EmailHeader(APP_NAME, 'Your Login Url'),
		EmailContent(
			EmailTitle('Magic Link Login 🪄'),
			EmailParagraph('Click the button to sign in to your account.'),
			EmailButton('Sign in 🪄', magicLink),
			EmailLinkDisplay(magicLink),
			EmailSmallText(`If you didn't try to login, you can safely ignore this email.`)
		),
		EmailFooter(email)
	);

	return buildEmailTemplate(`Login to ${APP_NAME}`, html);
}
