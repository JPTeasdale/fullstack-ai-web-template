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

export type InviteGenericTemplate = {
	inviteLink: string;
	email: string;
};

export function getInviteGenericTemplate({ inviteLink, email }: InviteGenericTemplate) {
	const html = EmailContainer(
		EmailHeader(APP_NAME, "You're invited!"),
		EmailContent(
			EmailTitle(`Accept your invitation to ${APP_NAME}.`),
			EmailParagraph(
				`You have been invited you to join ${APP_NAME}. Click the button to accept the invitation and create your account.`
			),
			EmailButton('Accept Invitation', inviteLink),
			EmailLinkDisplay(inviteLink),
			EmailSmallText(
				`This invitation will expire in 24 hours. If expired, request a new invitation.`
			)
		),
		EmailFooter(email)
	);

	return buildEmailTemplate(`[${APP_NAME}] Accept your invitation to ${APP_NAME}!`, html);
}
