import { assertAuthenticated } from '$lib/server/helpers/event';
import type { PageServerLoad } from './$types';
import { createAuthenticatedActionHandler } from '$lib/server/helpers/action_helpers';
import { generateConfirmationURL } from '$lib/server/auth/auth_utils';
import { getPasswordResetTemplate } from '$lib/email/templates/password_reset';
import { getMagicLinkTemplate } from '$lib/email/templates/magic_link';
import { getEmailConfirmTemplate } from '$lib/email/templates/email_confirm';
import { z } from 'zod';

export const load: PageServerLoad = async (event) => {
	assertAuthenticated(event);
	const { supabaseAdmin } = event.locals;

	const { data: users } = await supabaseAdmin.from('user_profiles').select('*');

	return { users };
};

const sendEmailSchema = z.object({
	userId: z.string(),
	email: z.string().email(),
	type: z.enum(['password_reset', 'magic_link', 'email_confirmation'])
});

export const actions = {
	sendEmail: createAuthenticatedActionHandler(async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = sendEmailSchema.parse({
			userId: formData.get('userId'),
			email: formData.get('email'),
			type: formData.get('type')
		});

		const { supabaseAdmin, emailService } = locals;
		const baseUrl = new URL(request.url).origin;

		let emailTemplate;
		let linkData;

		switch (parsed.type) {
			case 'password_reset':
				linkData = await supabaseAdmin.auth.admin.generateLink({
					type: 'recovery',
					email: parsed.email
				});

				if (linkData.error) {
					throw new Error(linkData.error.message);
				}

				emailTemplate = getPasswordResetTemplate({
					siteUrl: baseUrl,
					token: linkData.data.properties.hashed_token,
					email: parsed.email
				});
				break;

			case 'magic_link':
				linkData = await supabaseAdmin.auth.admin.generateLink({
					type: 'magiclink',
					email: parsed.email
				});

				if (linkData.error) {
					throw new Error(linkData.error.message);
				}

				const magicLink = generateConfirmationURL({
					baseUrl,
					token_hash: linkData.data.properties.hashed_token,
					email_action_type: 'magiclink',
					redirect_to: baseUrl
				});

				emailTemplate = getMagicLinkTemplate({
					magicLink,
					email: parsed.email
				});
				break;

			case 'email_confirmation':
				linkData = await supabaseAdmin.auth.admin.generateLink({
					type: 'invite',
					email: parsed.email
				});

				if (linkData.error) {
					throw new Error(linkData.error.message);
				}

				const confirmLink = generateConfirmationURL({
					baseUrl,
					token_hash: linkData.data.properties.hashed_token,
					email_action_type: 'signup',
					redirect_to: baseUrl
				});

				emailTemplate = getEmailConfirmTemplate({
					confirmLink,
					email: parsed.email
				});
				break;
		}

		await emailService.sendAuthEmail(
			parsed.email,
			emailTemplate.subject,
			emailTemplate.html,
			emailTemplate.text
		);

		return { success: true, message: `${parsed.type.replace('_', ' ')} email sent successfully` };
	})
};
