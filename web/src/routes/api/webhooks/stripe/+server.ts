import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getStripe, getSubscriptionMetadata } from '$lib/server/clients/stripe/stripe_client';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type Stripe from 'stripe';
import type { Enums } from '$lib/types/generated/supabase.types';

// Define relevant event types we handle
type RelevantEvent =
	| 'checkout.session.completed'
	| 'customer.subscription.created'
	| 'customer.subscription.updated'
	| 'customer.subscription.deleted'
	| 'customer.subscription.trial_will_end'
	| 'invoice.payment_succeeded'
	| 'invoice.payment_failed';

// Define the subscription status type to match our database enum
type SubscriptionStatus = Enums<'subscription_status'>;

// Map Stripe subscription status to our enum
function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
	switch (stripeStatus) {
		case 'incomplete':
			return 'incomplete';
		case 'incomplete_expired':
			return 'incomplete_expired';
		case 'trialing':
			return 'trialing';
		case 'active':
			return 'active';
		case 'past_due':
			return 'past_due';
		case 'canceled':
			return 'canceled';
		case 'unpaid':
			return 'unpaid';
		default:
			return 'incomplete';
	}
}

// Get user_id from Stripe customer or session
async function getUserIdFromStripe(
	stripe: Stripe,
	customerId?: string,
	sessionId?: string
): Promise<string | null> {
	try {
		// Try to get user_id from customer metadata
		if (customerId) {
			const customer = await stripe.customers.retrieve(customerId);
			if (customer && !customer.deleted && customer.metadata?.user_id) {
				return customer.metadata.user_id;
			}
		}

		// Try to get user_id from checkout session
		if (sessionId) {
			const session = await stripe.checkout.sessions.retrieve(sessionId);
			if (session.metadata?.user_id) {
				return session.metadata.user_id;
			}
			// Try customer from session
			if (session.customer && typeof session.customer === 'string') {
				return getUserIdFromStripe(stripe, session.customer);
			}
		}

		return null;
	} catch (error) {
		console.error('Error getting user_id from Stripe:', error);
		return null;
	}
}

export const POST: RequestHandler = async ({ request, locals }) => {
	console.log('POST /api/webhooks/stripe', {STRIPE_WEBHOOK_SECRET});
	const { supabaseAdmin } = locals;
	const stripe = getStripe();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		console.error('No stripe signature provided');
		return json({ error: 'No signature provided' }, { status: 400 });
	}

	if (!STRIPE_WEBHOOK_SECRET) {
		console.error('STRIPE_WEBHOOK_SECRET not configured');
		return json({ error: 'Webhook secret not configured' }, { status: 500 });
	}

	let event: Stripe.Event;
	const payload = await request.text();

	try {
		// Verify the webhook signature
		event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		return json({ error: 'Invalid signature' }, { status: 400 });
	}
	console.log(event.type, {event});    


	// Only handle specific event types
	const relevantEvents: RelevantEvent[] = [
		'checkout.session.completed',
		'customer.subscription.created',
		'customer.subscription.updated',
		'customer.subscription.deleted',
		'invoice.payment_succeeded',
		'invoice.payment_failed'
	];

	if (!relevantEvents.includes(event.type as RelevantEvent)) {
		return json({ received: true });
	}
	try {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;
				
				if (session.mode !== 'subscription' || !session.subscription) {
					break;
				}

				const userId = await getUserIdFromStripe(stripe, session.customer as string, session.id);
				if (!userId) {
					console.error('Could not find user_id for checkout session:', session.id);
					break;
				}

				// Retrieve the subscription details
				const subscription: any = await stripe.subscriptions.retrieve(session.subscription as string);
				const metadata = getSubscriptionMetadata(subscription);
				
				await supabaseAdmin.from('subscriptions').update({
					user_id: metadata.appUserId,
					stripe_subscription_id: subscription.id,
					stripe_customer_id: subscription.customer as string,
					stripe_price_id: subscription.items.data[0]?.price.id,
					status: mapStripeStatus(subscription.status),
					current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
					current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
					trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
					cancel_at_period_end: subscription.cancel_at_period_end || false,
					canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
				}).eq('id', metadata.appSubscriptionId);

				console.log(`Created subscription for user ${userId} from checkout session ${session.id}`);
				break;
			}

			case 'customer.subscription.created':
			case 'customer.subscription.updated': {
				const subscription: any = event.data.object as Stripe.Subscription;

				const userId = await getUserIdFromStripe(stripe, subscription.customer as string);
				if (!userId) {
					console.error('Could not find user_id for subscription:', subscription.id);
					break;
				}

				await supabaseAdmin.from('subscriptions').upsert({
					user_id: userId,
					stripe_subscription_id: subscription.id,
					stripe_customer_id: subscription.customer as string,
					stripe_price_id: subscription.items.data[0]?.price.id,
					status: mapStripeStatus(subscription.status),
					current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
					current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
					trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
					cancel_at_period_end: subscription.cancel_at_period_end || false,
					canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
				});

				console.log(`${event.type === 'customer.subscription.created' ? 'Created' : 'Updated'} subscription for user ${userId}`);
				break;
			}

			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;

				await supabaseAdmin
					.from('subscriptions')
					.update({
						status: 'canceled' as SubscriptionStatus,
						canceled_at: new Date().toISOString()
					})
					.eq('stripe_subscription_id', subscription.id);

				console.log(`Canceled subscription ${subscription.id}`);
				break;
			}

			case 'invoice.payment_succeeded': {
				const invoice = event.data.object as Stripe.Invoice;
				
				// Check if this invoice is related to a subscription
				const subscriptionId = (invoice as any).subscription;
				if (!subscriptionId) {
					break;
				}

				// Update subscription with latest period info
				const subscription: any = await stripe.subscriptions.retrieve(subscriptionId as string);
				
				await supabaseAdmin
					.from('subscriptions')
					.update({
						status: mapStripeStatus(subscription.status),
						current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
						current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null
					})
					.eq('stripe_subscription_id', subscription.id);

				console.log(`Updated subscription ${subscription.id} after successful payment`);
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice;
				
				// Check if this invoice is related to a subscription
				const subscriptionId = (invoice as any).subscription;
				if (!subscriptionId) {
					break;
				}

				// Update subscription status to past_due
				await supabaseAdmin
					.from('subscriptions')
					.update({
						status: 'past_due' as SubscriptionStatus
					})
					.eq('stripe_subscription_id', subscriptionId as string);

				console.log(`Updated subscription ${subscriptionId} to past_due after failed payment`);
				break;
			}

			default: {
				console.log(`Unhandled relevant event type: ${event.type}`);
			}
		}

		return json({ received: true });
	} catch (error) {
		console.error('Error processing webhook:', error);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
};
