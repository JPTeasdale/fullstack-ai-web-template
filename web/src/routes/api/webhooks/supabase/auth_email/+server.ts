import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getEmailTemplate } from '$lib/email_templates/email_templates';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { SUPABASE_AUTH_EMAIL_WEBHOOK_SECRET } from '$env/static/private';
import { Webhook } from 'standardwebhooks';

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

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const payload = await request.text();
		const headers = Object.fromEntries(request.headers);
		const wh = new Webhook(SUPABASE_AUTH_EMAIL_WEBHOOK_SECRET);

		let verifiedPayload: AuthEmailPayload | null = null;
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
		
		console.log('Auth email webhook received:', {
			userId: user.id,
			email: user.email,
			actionType: email_data.email_action_type,
			timestamp: new Date().toISOString()
		});

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

		const emailTemplate = getEmailTemplate(email_data.email_action_type, {
			token: email_data.token,
			redirectTo: email_data.redirect_to,
			siteUrl: email_data.site_url
		});

		try {
			await locals.ses.send(
				new SendEmailCommand({
					Source: 'noreply@yourapp.com',
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
