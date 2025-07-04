import { NotFoundError, OperationError, ConfigurationError } from '$lib/server/errors';
import type { AuthenticatedEvent } from '$lib/server/api/context';
import type { CreateSubscriptionData } from '$lib/schemas/subscriptions';
import {
	getStripe,
	fetchPriceId,
	getSubscriptionMetadata,
	convertStripeSubscription,
	type AppSubscriptionType
} from '$lib/server/services/stripe/stripe_client';
import { urlOrganizationSubscription } from '$lib/url';

/**
 * Get organization subscription with price information
 * RLS ensures user can only access subscriptions for organizations they're members of
 */
export const getOrganizationSubscription = async (
	event: AuthenticatedEvent,
	organizationId: string
) => {
	const { supabase } = event.locals;

	// Fetch organization subscription
	const { data: subscription, error } = await supabase
		.from('subscriptions')
		.select('*')
		.eq('organization_id', organizationId)
		.neq('status', 'incomplete')
		.maybeSingle();

	if (error) {
		throw new OperationError(`Failed to fetch subscription: ${error.message}`, 'database.fetch', {
			organizationId: organizationId,
			errorCode: error.code
		});
	}

	// Get price information from Stripe if subscription exists
	let priceInfo = null;
	if (subscription?.stripe_price_id) {
		try {
			const stripe = getStripe();
			const price = await stripe.prices.retrieve(subscription.stripe_price_id, {
				expand: ['product']
			});
			priceInfo = {
				amount: price.unit_amount ? price.unit_amount / 100 : 0,
				currency: price.currency,
				interval: price.recurring?.interval,
				productName:
					typeof price.product !== 'string' && 'name' in price.product
						? price.product.name
						: 'Subscription'
			};
		} catch (err) {
			console.error('[Subscription] Error fetching price info:', err);
		}
	}

	return { subscription, priceInfo };
};

/**
 * Process successful checkout session
 * Updates subscription status after successful Stripe checkout
 */
export const processCheckoutSuccess = async (
	event: AuthenticatedEvent,
	{
		organizationId,
		checkoutSessionId
	}: {
		organizationId: string;
		checkoutSessionId: string;
	}
) => {
	const { supabaseAdmin } = event.locals;

	try {
		const stripe = getStripe();
		const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
		const subscriptionId = session.subscription as string;

		if (subscriptionId) {
			const subscription = await stripe.subscriptions.retrieve(subscriptionId);
			const { appSubscriptionId } = getSubscriptionMetadata(subscription);

			const update = convertStripeSubscription(subscription);

			const { error } = await supabaseAdmin
				.from('subscriptions')
				.update(update)
				.eq('id', appSubscriptionId);

			if (error) {
				throw new OperationError(
					`Failed to update subscription after checkout: ${error.message}`,
					'database.update',
					{ appSubscriptionId, errorCode: error.code }
				);
			}
		}
	} catch (err) {
		console.error('[Subscription] Error processing checkout success:', err);
		throw new OperationError('Failed to process checkout success', 'stripe.checkout', {
			checkoutSessionId
		});
	}
};

/**
 * Create a new subscription and redirect to Stripe checkout
 * Returns the checkout URL for redirection
 */
export const createSubscription = async (
	event: AuthenticatedEvent,
	{ organizationId, ...data }: CreateSubscriptionData & { organizationId: string }
) => {
	const { supabaseAdmin, user } = event.locals;
	const baseUrl = event.url.origin;

	try {
		const stripe = getStripe();

		// Create subscription record
		const { data: subscription, error } = await supabaseAdmin
			.from('subscriptions')
			.upsert(
				{
					organization_id: organizationId,
					status: 'incomplete'
				},
				{ onConflict: 'organization_id' }
			)
			.select()
			.single();

		if (error || !subscription) {
			throw new OperationError(
				`Failed to create subscription record: ${error?.message}`,
				'database.insert',
				{ organizationId, errorCode: error?.code }
			);
		}

		// Get the price ID for the selected plan
		const priceId = await fetchPriceId(stripe, data.plan as AppSubscriptionType);

		if (!priceId) {
			throw new ConfigurationError('Invalid subscription plan configuration');
		}

		// Create Stripe checkout session
		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			line_items: [
				{
					price: priceId,
					quantity: 1
				}
			],
			success_url: `${baseUrl}${urlOrganizationSubscription(organizationId)}?payment_intent={CHECKOUT_SESSION_ID}`,
			cancel_url: `${baseUrl}${urlOrganizationSubscription(organizationId)}`,
			subscription_data: {
				metadata: {
					appSubscriptionId: subscription.id,
					appUserId: user.id
				}
			}
		});

		if (!session.url) {
			throw new OperationError('Failed to create checkout session', 'stripe.checkout');
		}

		return { checkoutUrl: session.url };
	} catch (err) {
		if (
			err instanceof Error &&
			err.name !== 'OperationError' &&
			err.name !== 'ConfigurationError'
		) {
			console.error('[Subscription] Error creating subscription:', err);
			throw new OperationError('Failed to create subscription', 'stripe.checkout', {
				organizationId
			});
		}
		throw err;
	}
};

/**
 * Cancel subscription at period end
 * Does not immediately cancel but marks for cancellation
 */
export const cancelSubscription = async (event: AuthenticatedEvent, organizationId: string) => {
	const { supabase, supabaseAdmin } = event.locals;

	// Get subscription
	const { data: subscription } = await supabase
		.from('subscriptions')
		.select('stripe_subscription_id')
		.eq('organization_id', organizationId)
		.single();

	if (!subscription?.stripe_subscription_id) {
		throw new NotFoundError('Active subscription');
	}

	try {
		const stripe = getStripe();

		// Cancel at period end instead of immediately
		const stripeSubscription = await stripe.subscriptions.update(
			subscription.stripe_subscription_id,
			{
				cancel_at_period_end: true
			}
		);

		const { appSubscriptionId } = getSubscriptionMetadata(stripeSubscription);

		// Update local database
		const { error } = await supabaseAdmin
			.from('subscriptions')
			.update(convertStripeSubscription(stripeSubscription))
			.eq('id', appSubscriptionId);

		if (error) {
			throw new OperationError(
				`Failed to update subscription after cancellation: ${error.message}`,
				'database.update',
				{ organizationId: organizationId, errorCode: error.code }
			);
		}

		return { success: true };
	} catch (err) {
		if (err instanceof Error && err.name !== 'OperationError') {
			console.error('[Subscription] Error canceling subscription:', err);
			throw new OperationError('Failed to cancel subscription', 'stripe.subscription', {
				organizationId: organizationId
			});
		}
		throw err;
	}
};

/**
 * Reactivate a canceled subscription
 * Removes the cancellation flag
 */
export const reactivateSubscription = async (event: AuthenticatedEvent, organizationId: string) => {
	const { supabase, supabaseAdmin } = event.locals;

	// Get subscription
	const { data: subscription } = await supabase
		.from('subscriptions')
		.select('stripe_subscription_id')
		.eq('organization_id', organizationId)
		.single();

	if (!subscription?.stripe_subscription_id) {
		throw new NotFoundError('Subscription');
	}

	try {
		const stripe = getStripe();

		// Remove cancellation
		const stripeSubscription = await stripe.subscriptions.update(
			subscription.stripe_subscription_id,
			{
				cancel_at_period_end: false
			}
		);

		const { appSubscriptionId } = getSubscriptionMetadata(stripeSubscription);

		// Update local database
		const { error } = await supabaseAdmin
			.from('subscriptions')
			.update(convertStripeSubscription(stripeSubscription))
			.eq('id', appSubscriptionId);

		if (error) {
			throw new OperationError(
				`Failed to update subscription after reactivation: ${error.message}`,
				'database.update',
				{ organizationId: organizationId, errorCode: error.code }
			);
		}

		return { success: true };
	} catch (err) {
		if (err instanceof Error && err.name !== 'OperationError') {
			console.error('[Subscription] Error reactivating subscription:', err);
			throw new OperationError('Failed to reactivate subscription', 'stripe.subscription', {
				organizationId: organizationId
			});
		}
		throw err;
	}
};

/**
 * Create session for updating payment method
 * Returns the checkout URL for payment method update
 */
export const createPaymentUpdateSession = async (
	event: AuthenticatedEvent,
	organizationId: string
) => {
	const { supabase } = event.locals;
	const baseUrl = event.url.origin;

	// Get subscription
	const { data: subscription } = await supabase
		.from('subscriptions')
		.select('stripe_customer_id')
		.eq('organization_id', organizationId)
		.single();

	if (!subscription?.stripe_customer_id) {
		throw new NotFoundError('Customer');
	}

	try {
		const stripe = getStripe();

		// Create a session for updating payment method
		const session = await stripe.checkout.sessions.create({
			mode: 'setup',
			customer: subscription.stripe_customer_id,
			success_url: `${baseUrl}?success=true`,
			cancel_url: baseUrl
		});

		if (!session.url) {
			throw new OperationError('Failed to create payment update session', 'stripe.checkout');
		}

		return { checkoutUrl: session.url };
	} catch (err) {
		if (err instanceof Error && err.name !== 'OperationError') {
			console.error('[Subscription] Error creating payment update session:', err);
			throw new OperationError('Failed to create payment update session', 'stripe.checkout', {
				organizationId: organizationId
			});
		}
		throw err;
	}
};
