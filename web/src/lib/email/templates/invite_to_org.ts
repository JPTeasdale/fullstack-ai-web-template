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

export type InviteToOrgTemplate = {
	inviteLink: string;
	inviterName: string;
	orgName: string;
	email: string;
};

export function getInviteToOrgTemplate({
	inviteLink,
	inviterName,
	orgName,
	email
}: InviteToOrgTemplate) {
	const filteredOrgName = orgName.replace(/\.$/, '');

	const html = EmailContainer(
		EmailHeader(APP_NAME, "You're invited!"),
		EmailContent(
			EmailTitle(`Accept your invitation to ${filteredOrgName}.`),
			EmailParagraph(
				`${inviterName} has invited you to join ${filteredOrgName} on ${APP_NAME}. Click the button to accept the invitation.`
			),
			EmailButton('Accept Invitation', inviteLink),
			EmailLinkDisplay(inviteLink),
			EmailSmallText(
				`This invitation will expire in 24 hours. If it is expired, you can ask ${inviterName} to send you a new invitation.`
			)
		),
		EmailFooter(email)
	);

	return buildEmailTemplate(`[${APP_NAME}] Accept your invitation to ${filteredOrgName}!`, html);
}
