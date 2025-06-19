import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getEmailTemplate } from '$lib/email_templates/email_templates';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { SUPABASE_AUTH_EMAIL_WEBHOOK_SECRET } from '$env/static/private';

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

// Verify webhook signature using HMAC
function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string,
	timestamp: string
): boolean {
	try {
		// Check timestamp to prevent replay attacks (optional)
		const now = Math.floor(Date.now() / 1000);
		const webhookTimestamp = parseInt(timestamp);
		const maxAge = 300; // 5 minutes

		if (Math.abs(now - webhookTimestamp) > maxAge) {
			console.error('Webhook timestamp too old');
			return false;
		}

		// Standard webhooks format: webhook-id.timestamp.payload
		const signedPayload = `webhook.${timestamp}.${payload}`;

		// Generate expected signature
		const expectedSignature = createHmac('sha256', secret)
			.update(signedPayload, 'utf8')
			.digest('base64');

		// Remove 'v1,' prefix if present
		const cleanSignature = signature.startsWith('v1,') ? signature.slice(3) : signature;

		// Compare signatures using timing-safe comparison
		const expectedBuffer = Buffer.from(expectedSignature, 'base64');
		const actualBuffer = Buffer.from(cleanSignature, 'base64');

		if (expectedBuffer.length !== actualBuffer.length) {
			return false;
		}

		return timingSafeEqual(expectedBuffer, actualBuffer);
	} catch (error) {
		console.error('Error verifying webhook signature:', error);
		return false;
	}
}

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('POST /api/webhooks/supabase/auth_email');

	try {
		// Get the request payload and headers
		const payload = await request.text();
		const signature =
			request.headers.get('webhook-signature') || request.headers.get('x-supabase-signature');
		const timestamp =
			request.headers.get('webhook-timestamp') || request.headers.get('x-supabase-timestamp');

		if (!signature || !timestamp) {
			console.error('Missing webhook signature or timestamp');
			return json({ error: 'Missing signature or timestamp' }, { status: 401 });
		}

		// Verify the webhook signature
		const isValid = verifyWebhookSignature(payload, signature, SUPABASE_AUTH_EMAIL_WEBHOOK_SECRET, timestamp);

		if (!isValid) {
			console.error('Webhook signature verification failed');
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		// Parse the verified payload
		let verifiedPayload: AuthEmailPayload;
		try {
			verifiedPayload = JSON.parse(payload);
		} catch (parseError) {
			console.error('Invalid JSON payload:', parseError);
			return json({ error: 'Invalid payload format' }, { status: 400 });
		}

		const { user, email_data } = verifiedPayload;

		console.log('Auth email webhook received:', {
			userId: user.id,
			email: user.email,
			actionType: email_data.email_action_type,
			timestamp: new Date().toISOString()
		});

		// Log the auth event to the database for audit purposes
		if (locals.supabaseAdmin) {
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
		}

		// Here you can add custom email sending logic
		//
		// Example using AWS SES (if you have it configured):
		if (locals.ses) {
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
		}

		// For now, just log that we received the webhook
		console.log('Auth email webhook processed successfully', {
			userId: user.id,
			email: user.email,
			actionType: email_data.email_action_type
		});

		// // Process specific email action types
		// switch (email_data.email_action_type) {
		// 	case 'signup':
		// 		console.log(`New user signup: ${user.email}`);
		// 		// Add custom signup logic here (e.g., send welcome notifications, create user profile, etc.)
		// 		break;

		// 	case 'recovery':
		// 		console.log(`Password recovery requested: ${user.email}`);
		// 		// Add custom recovery logic here (e.g., log security event, notify user via other channels)
		// 		break;

		// 	case 'invite':
		// 		console.log(`User invited: ${user.email}`);
		// 		// Add custom invite logic here (e.g., notify team members, track invitations)
		// 		break;

		// 	case 'magic_link':
		// 		console.log(`Magic link requested: ${user.email}`);
		// 		// Add custom magic link logic here
		// 		break;

		// 	case 'email_change_confirm_new':
		// 	case 'email_change_confirm_old':
		// 		console.log(`Email change confirmation: ${user.email}`);
		// 		// Add custom email change logic here
		// 		break;

		// 	default:
		// 		console.log(`Unknown email action type: ${email_data.email_action_type}`);
		// }

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
