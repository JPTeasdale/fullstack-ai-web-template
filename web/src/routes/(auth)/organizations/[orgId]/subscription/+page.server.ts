import type { PageServerLoad, Actions } from './$types';
import {
	fetchPriceId,
	getStripe,
	getSubscriptionMetadata,
	type AppSubscriptionType
} from '$lib/server/clients/stripe/stripe_client';
import { urlOrganizationSubscription } from '$lib/url';
import { fail, redirect, isRedirect } from '@sveltejs/kit';
import { convertStripeSubscription } from '$lib/server/clients/stripe/stripe_client';

export const load: PageServerLoad = async ({ locals: { supabase, supabaseAdmin }, url }) => {
	// Check for success parameters from Stripe
	const checkoutSessionId = url.searchParams.get('payment_intent');
	// url.searchParams.delete('payment_intent');
	const success = url.searchParams.get('success');
	const stripe = getStripe();

	if (checkoutSessionId) {
		const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
		const subscriptionId = session.subscription as string;

		if (subscriptionId) {
			const subscription = await stripe.subscriptions.retrieve(subscriptionId);
			const { appSubscriptionId } = getSubscriptionMetadata(subscription);

			const update = convertStripeSubscription(subscription);

			await supabaseAdmin
				.from('subscriptions')
				.update(update)
				.eq('id', appSubscriptionId)
				.select()
				.single();
		}
	}

	// Fetch organization subscription
	const { data: subscription, error } = await supabase
		.from('subscriptions')
		.select('*')
		.neq('status', 'incomplete')
		.maybeSingle();

	if (error) {
		console.error('Error fetching subscription:', error);
	}

	// Get price information from Stripe if subscription exists
	let priceInfo = null;
	if (subscription?.stripe_price_id) {
		try {
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
			console.error('Error fetching price info:', err);
		}
	}

	return {
		subscription,
		priceInfo,
		checkoutSuccess: !!checkoutSessionId || success === 'true'
	};
};

export const actions: Actions = {
	cancel: async ({ locals: { supabase, supabaseAdmin } }) => {
		const { data: subscription } = await supabase
			.from('subscriptions')
			.select('stripe_subscription_id')
			.single();

		if (!subscription?.stripe_subscription_id) {
			return fail(400, { error: 'No active subscription found' });
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
			await supabaseAdmin
				.from('subscriptions')
				.update(convertStripeSubscription(stripeSubscription))
				.eq('id', appSubscriptionId);

			return { success: true };
		} catch (error) {
			console.error('Error canceling subscription:', error);
			return fail(500, { error: 'Failed to cancel subscription' });
		}
	},

	reactivate: async ({ locals: { supabase, supabaseAdmin }, params }) => {
		const { data: subscription } = await supabase
			.from('subscriptions')
			.select('stripe_subscription_id')
			.single();

		if (!subscription?.stripe_subscription_id) {
			return fail(400, { error: 'No subscription found' });
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
			await supabaseAdmin
				.from('subscriptions')
				.update(convertStripeSubscription(stripeSubscription))
				.eq('id', appSubscriptionId);

			return { success: true };
		} catch (error) {
			console.error('Error reactivating subscription:', error);
			return fail(500, { error: 'Failed to reactivate subscription' });
		}
	},

	updatePaymentMethod: async ({ locals: { supabase }, request }) => {
		const { data: subscription } = await supabase
			.from('subscriptions')
			.select('stripe_customer_id')
			.single();

		if (!subscription?.stripe_customer_id) {
			return fail(400, { error: 'No customer found' });
		}

		try {
			const stripe = getStripe();
			// Create a session for updating payment method
			const session = await stripe.checkout.sessions.create({
				mode: 'setup',
				customer: subscription.stripe_customer_id,
				success_url: `${request.url}?success=true`,
				cancel_url: request.url
			});

			if (session.url) {
				throw redirect(303, session.url);
			}
		} catch (error) {
			if (error instanceof Response) throw error;
			console.error('Error creating payment update session:', error);
			return fail(500, { error: 'Failed to create payment update session' });
		}
	},

	createSubscription: async (event) => {
		const { request, locals, params, url } = event;
		const { orgId } = params;
		const formData = await request.formData();
		const planType = formData.get('plan') as AppSubscriptionType;

		if (!planType) {
			return fail(400, { error: 'Please select a subscription plan' });
		}

		try {
			// Create subscription directly with Stripe instead of using the helper
			const { supabaseAdmin, user } = locals;
			if (!user) {
				return fail(401, { error: 'User not found' });
			}

			const stripe = getStripe();
			const { data: subscription, error } = await supabaseAdmin
				.from('subscriptions')
				.upsert(
					{
						organization_id: orgId,
						status: 'incomplete'
					},
					{ onConflict: 'organization_id' }
				)
				.select()
				.single();

			if (error || !subscription) {
				console.error('Error creating subscription record:', error);
				return fail(500, { error: 'Failed to create subscription record' });
			}

			// Get the price ID for the selected plan
			const priceId = await fetchPriceId(stripe, planType);

			if (!priceId) {
				return fail(400, { error: 'Invalid subscription plan' });
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
				success_url: `${url.origin}${urlOrganizationSubscription(params.orgId)}?payment_intent={CHECKOUT_SESSION_ID}`,
				cancel_url: `${url.origin}${urlOrganizationSubscription(params.orgId)}`,
				subscription_data: {
					metadata: {
						appSubscriptionId: subscription.id,
						appUserId: user.id
					}
				}
			});

			if (session.url) {
				throw redirect(303, session.url);
			}
		} catch (error) {
			if (isRedirect(error)) {
				throw error;
			}
			console.error('Error creating subscription:', error);
			return fail(500, { error: 'Failed to create subscription' });
		}
	}
};
