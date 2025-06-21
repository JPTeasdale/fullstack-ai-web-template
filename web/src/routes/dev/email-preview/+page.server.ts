import { getEmailConfirmTemplate } from '$lib/email/templates/email_confirm';
import { getInviteGenericTemplate } from '$lib/email/templates/invite_generic';
import { getInviteToOrgTemplate } from '$lib/email/templates/invite_to_org';
import { getMagicLinkTemplate } from '$lib/email/templates/magic_link';
import { getEmailOtpTemplate } from '$lib/email/templates/otp_login_code';
import { getPasswordResetTemplate } from '$lib/email/templates/password_reset';

export async function load({ url }: { url: URL }) {
	// return the list of email components

	const templates = {
		email_confirm: getEmailConfirmTemplate({
			siteUrl: url.origin,
			token: '123456',
			email: 'test@test.com',
			redirectTo: url.origin
		}),
		password_reset: getPasswordResetTemplate({
			siteUrl: url.origin,
			token: '123456',
			email: 'test@test.com'
		}),
		invite_to_org: getInviteToOrgTemplate({
			inviteLink: url.origin,
			inviterName: 'Jane Doe',
			orgName: 'Acme Inc.',
			email: 'test@test.com'
		}),
		invite_generic: getInviteGenericTemplate({
			inviteLink: url.origin,
			email: 'test@test.com'
		}),
		email_otp: getEmailOtpTemplate({
			token: '123456',
			email: 'test@test.com',
			appUrl: url.origin
		}),
		magic_link: getMagicLinkTemplate({
			magicLink: `${url.origin}/auth/magic-link?token=123456`,
			email: 'test@test.com'
		})
	};

	return {
		templates: Object.entries(templates).map(([name, template]) => ({
			name,
			...template
		}))
	};
}
