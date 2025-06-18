import Stripe from 'stripe';

import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';

export const stripeWebhookSecret = STRIPE_WEBHOOK_SECRET;

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
	const prices = await client.prices.search({
		query: `metadata['price_type']:'${type}'`
	});

	if (!prices.data[0]) {
		throw new Error('No prices found for type: ' + type);
	}

	if (prices.data.length > 1) {
		throw new Error('Multiple prices found for type: ' + type);
	}

	return prices.data[0].id;
}