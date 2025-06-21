import { APP_NAME } from '$lib/app/constants';
import {
	buildEmailTemplate,
	EmailHeader,
	EmailContent,
	EmailTitle,
	EmailParagraph,
	EmailSmallText,
	EmailFooter,
	EmailContainer
} from '../components';

export type EmailOtpTemplate = {
	token: string;
	email: string;
	appUrl: string;
};

export function getEmailOtpTemplate({ token, email, appUrl }: EmailOtpTemplate) {
	const html = EmailContainer(
		EmailHeader(APP_NAME, 'Confirmation Code'),
		EmailContent(
			EmailParagraph(`This is your one-time password for ${APP_NAME}.`),
			EmailTitle(token),
			EmailParagraph(`Please return to ${appUrl} and enter this code to login.`),

			EmailSmallText(`If you didn't try to login, you can safely ignore this email.`)
		),
		EmailFooter(email)
	);

	return buildEmailTemplate(`[${APP_NAME}] Your Login Code`, html);
}
