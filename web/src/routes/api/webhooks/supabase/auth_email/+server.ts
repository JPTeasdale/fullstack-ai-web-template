import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { type EmailTemplate } from '$lib/email';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { SUPABASE_AUTH_EMAIL_WEBHOOK_SECRET, SUPABASE_URL } from '$env/static/private';
import { Webhook } from 'standardwebhooks';
import { getEmailConfirmTemplate } from '$lib/email/templates/email_confirm';
import { getPasswordResetTemplate } from '$lib/email/templates/password_reset';
import { getInviteGenericTemplate } from '$lib/email/templates/invite_generic';
import { getMagicLinkTemplate } from '$lib/email/templates/magic_link';
import { URL_VERIFY_MAGIC_LINK } from '$lib/url';

// Define the auth email event payload structure
interface AuthEmailUser {
	id: string;
	aud: string;
	role: string;
	email: string;
	phone: string;
	app_metadata: {
		provider: string;
		providers: string[];
	};
	user_metadata: {
		email: string;
		email_verified: boolean;
		phone_verified: boolean;
		sub: string;
	};
	identities: Array<{
		identity_id: string;
		id: string;
		user_id: string;
		identity_data: Record<string, any>;
		provider: string;
		last_sign_in_at: string;
		created_at: string;
		updated_at: string;
		email: string;
	}>;
	created_at: string;
	updated_at: string;
	is_anonymous: boolean;
}

interface AuthEmailData {
	token: string;
	token_hash: string;
	redirect_to: string;
	email_action_type:
		| 'signup'
		| 'recovery'
		| 'invite'
		| 'magic_link'
		| 'confirmation'
		| 'email_change_confirm_new'
		| 'email_change_confirm_old';
	site_url: string;
	token_new: string;
	token_hash_new: string;
}

interface AuthEmailPayload {
	user: AuthEmailUser;
	email_data: AuthEmailData;
}

// Wrap the confirmation URL in a login parameter to prevent the link from being invalidated by email client pre-fetching
function generateConfirmationURL(baseUrl: string, email_data: AuthEmailData) {
	const confirmLink = `${baseUrl}${URL_VERIFY_MAGIC_LINK}?token_hash=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;
	return `${baseUrl}${URL_VERIFY_MAGIC_LINK}?login=${encodeURIComponent(confirmLink)}`;
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
	console.log({ request, url });
	try {
		const payload = await request.text();
		const headers = Object.fromEntries(request.headers);
		let verifiedPayload: AuthEmailPayload | null = null;

		const wh = new Webhook(SUPABASE_AUTH_EMAIL_WEBHOOK_SECRET.replace('v1,', ''));

		try {
			verifiedPayload = wh.verify(payload, headers) as AuthEmailPayload;
		} catch (error) {
			console.error('Webhook signature verification failed:', error);
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		if (!verifiedPayload) {
			console.error('Webhook signature verification failed');
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		const { user, email_data } = verifiedPayload;

		console.log('Auth email webhook received:', verifiedPayload);

		// Log the auth event to the database for audit purposes
		try {
			await locals.supabaseAdmin.from('audit_logs').insert({
				action: 'login', // Using existing enum value since 'auth_email_sent' isn't available
				user_id: user.id,
				resource_type: 'auth_email',
				resource_id: user.id,
				metadata: {
					email_action_type: email_data.email_action_type,
					email: user.email,
					token_hash: email_data.token_hash,
					redirect_to: email_data.redirect_to,
					webhook_event: 'auth_email_sent'
				}
			});
		} catch (auditError) {
			console.error('Failed to log audit event:', auditError);
			// Don't fail the webhook for audit logging errors
		}

		let emailTemplate: EmailTemplate | null = null;
		const confirmLink = generateConfirmationURL(url.origin, email_data);
		switch (email_data.email_action_type) {
			case 'signup':
			case 'confirmation':
				emailTemplate = getEmailConfirmTemplate({
					confirmLink,
					email: user.email
				});
				break;
			case 'recovery':
				emailTemplate = getPasswordResetTemplate({
					token: email_data.token,
					siteUrl: email_data.site_url,
					email: user.email
				});
				break;
			case 'invite':
				emailTemplate = getInviteGenericTemplate({
					inviteLink: `${email_data.site_url}/auth/invite?token=${email_data.token}`,
					email: user.email
				});
				break;
			case 'magic_link':
				emailTemplate = getMagicLinkTemplate({
					magicLink: confirmLink,
					email: user.email
				});
				break;
			case 'email_change_confirm_new':
			case 'email_change_confirm_old':
				break;
		}

		if (!emailTemplate) {
			console.error('No email template found for action:', email_data.email_action_type);
			return json({ error: 'No email template found' }, { status: 400 });
		}

		try {
			await locals.ses.send(
				new SendEmailCommand({
					Source: 'noreply@johnteasdale.com',
					Destination: {
						ToAddresses: [user.email]
					},
					Message: {
						Subject: {
							Data: emailTemplate.subject,
							Charset: 'UTF-8'
						},
						Body: {
							Html: {
								Data: emailTemplate.html,
								Charset: 'UTF-8'
							},
							Text: {
								Data: emailTemplate.text,
								Charset: 'UTF-8'
							}
						}
					}
				})
			);

			console.log(
				`Auth email sent successfully to ${user.email} for action: ${email_data.email_action_type}`
			);
		} catch (emailError) {
			console.error('Failed to send auth email:', emailError);
			return json(
				{
					error: {
						http_code: 500,
						message: 'Failed to send authentication email'
					}
				},
				{ status: 500 }
			);
		}

		// For now, just log that we received the webhook
		console.log('Auth email webhook processed successfully', {
			userId: user.id,
			email: user.email,
			actionType: email_data.email_action_type
		});
		// Return success response
		return json({ received: true, processed: true });
	} catch (error) {
		console.error('Error processing auth email webhook:', error);
		return json(
			{
				error: {
					http_code: 500,
					message: 'Internal server error'
				}
			},
			{ status: 500 }
		);
	}
};
