import Stripe from 'stripe';

import { STRIPE_SECRET_KEY } from '$env/static/private';
import type { Enums, Tables } from '$lib/types/generated/supabase.types';

export function getStripe() {
	return new Stripe(STRIPE_SECRET_KEY, {
		apiVersion: '2025-05-28.basil'
	});
}

// Helper functions to determine when a subscription is paid until
export function getSubscriptionPaidUntil(subscription: Stripe.Subscription) {
	const firstItem = subscription.items.data[0];
	return new Date(firstItem.current_period_end * 1000);
}

// Metadata for the subscription. Links the stripe DB to the app DB.
export type StripeSubscriptionMetadata = {
	appSubscriptionId: string;
	appUserId: string;
};

export function getSubscriptionMetadata(subscription: Stripe.Subscription) {
	return subscription.metadata as StripeSubscriptionMetadata;
}

export function makeSubscriptionMetadata(metadata: StripeSubscriptionMetadata) {
	return metadata;
}

// Price Types

// Price ids vary between environments in Stripe, so we use metadata to fetch
// the price id across environments.

// These metadata strings must be attached to a price object in stripe.
export type AppSubscriptionType = 'basic_weekly' | 'basic_yearly' | 'pro_weekly' | 'pro_yearly';

export async function fetchPriceId(client: Stripe, type: AppSubscriptionType) {
	const pricesList = await client.prices.list({
		lookup_keys: [type],
		limit: 1
	});

	if (!pricesList.data[0]) {
		throw new Error('No prices found for type: ' + type);
	}

	if (pricesList.data.length > 1) {
		throw new Error('Multiple prices found for type: ' + type);
	}

	return pricesList.data[0].id;
}

function mapStripeStatus(subscription: Stripe.Subscription): Enums<'subscription_status'> {
	
	const status = subscription.status as Stripe.Subscription.Status;
	const paidUntil = getSubscriptionPaidUntil(subscription);
	const willEnd = Boolean(
		subscription.cancel_at_period_end && paidUntil > new Date()
	);
	if (willEnd) {
		return 'will_expire';
	}

	switch (status) {
		case 'incomplete':
			return 'incomplete';
		case 'incomplete_expired':
			return 'incomplete';
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

export function convertStripeSubscription(
	subscription: Stripe.Subscription
): Tables<'subscriptions'> {
	return {
		stripe_subscription_id: subscription.id,
		stripe_customer_id: subscription.customer as string,
		stripe_price_id: subscription.items.data[0]?.price.id,
		app_subscription_type: subscription.items.data[0]?.price.lookup_key as AppSubscriptionType,
		status: mapStripeStatus(subscription),
		current_period_end: getSubscriptionPaidUntil(subscription).toISOString(),
		trial_end: subscription.trial_end
			? new Date(subscription.trial_end * 1000).toISOString()
			: null,
		cancel_at_period_end: subscription.cancel_at_period_end || false,
		canceled_at: subscription.canceled_at
			? new Date(subscription.canceled_at * 1000).toISOString()
			: null
	};
}
