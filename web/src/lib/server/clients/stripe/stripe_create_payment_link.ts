import {
	getStripe,
	fetchPriceId,
	makeSubscriptionMetadata,
	type AppSubscriptionType
} from '$lib/server/clients/stripe/stripe_client';
import { URL_CONFIRM_SUBSCRIPTION_STRIPE_TEMPLATE, URL_DASHBOARD } from '$lib/url';
import type { ServerLoadEvent } from '@sveltejs/kit';

interface AppSubscriptionOptions {
	type: AppSubscriptionType;
}

export async function createSubscriptionPaymentLink(
	event: ServerLoadEvent,
	opts: AppSubscriptionOptions
) {
	const { url } = event;
	const { supabaseAdmin, user } = event.locals;
	if (!user) {
		throw new Error('User not found');
	}

	const stripe = getStripe();
	const priceId = await fetchPriceId(stripe, opts.type);

	// Create a subscription in the app database to get a subscription id
	// This is used to identify the subscription in the stripe webhook
	// The subscription object can then be tied to a user, or organization, or whatever
	const { data: subscription, error } = await supabaseAdmin
		.from('subscriptions')
		.insert({
			user_id: user.id,
			price_id: priceId,
			subscription_type: opts.type
		})
		.select()
		.single();

	if (error) {
		throw new Error('Failed to create subscription');
	}

	const paymentLink = await stripe.checkout.sessions.create({
		mode: 'subscription',
		line_items: [
			{
				price: priceId,
				quantity: 1
			}
		],
		success_url: `${url.origin}${URL_CONFIRM_SUBSCRIPTION_STRIPE_TEMPLATE}`,
		subscription_data: {
			metadata: makeSubscriptionMetadata({
				appSubscriptionId: subscription.id,
				appUserId: user.id
			})
		},
		cancel_url: `${url.origin}${URL_DASHBOARD}`
	});

	return paymentLink.url;
}
