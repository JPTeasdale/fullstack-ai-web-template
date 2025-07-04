import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import {
	createAuthenticatedActionHandler,
	createAuthenticatedValidatedActionHandler
} from '$lib/server/actions/helpers';
import { createSubscriptionSchema } from '$lib/schemas/subscriptions';
import {
	getOrganizationSubscription,
	processCheckoutSuccess,
	createSubscription,
	cancelSubscription,
	reactivateSubscription,
	createPaymentUpdateSession
} from '$lib/server/models/subscriptions';
import { extractOrganizationId, assertAuthenticated } from '$lib/server/api/context';

export const load: PageServerLoad = async (event) => {
	assertAuthenticated(event);
	const organizationId = extractOrganizationId(event);

	// Check for success parameters from Stripe
	const checkoutSessionId = event.url.searchParams.get('payment_intent');
	const success = event.url.searchParams.get('success');

	// Process checkout success if session ID is present
	if (checkoutSessionId) {
		await processCheckoutSuccess(event, { organizationId, checkoutSessionId });
	}

	// Get subscription and price info
	const { subscription, priceInfo } = await getOrganizationSubscription(event, organizationId);

	return {
		subscription,
		priceInfo,
		checkoutSuccess: !!checkoutSessionId || success === 'true'
	};
};

export const actions: Actions = {
	cancel: createAuthenticatedActionHandler(async (event) => {
		const organizationId = extractOrganizationId(event);
		await cancelSubscription(event, organizationId);
		return { success: true };
	}),

	reactivate: createAuthenticatedActionHandler(async (event) => {
		const organizationId = extractOrganizationId(event);
		await reactivateSubscription(event, organizationId);
		return { success: true };
	}),

	updatePaymentMethod: createAuthenticatedActionHandler(async (event) => {
		const organizationId = extractOrganizationId(event);

		const { checkoutUrl } = await createPaymentUpdateSession(event, organizationId);
		throw redirect(303, checkoutUrl);
	}),

	createSubscription: createAuthenticatedValidatedActionHandler(
		createSubscriptionSchema,
		async (event) => {
			const organizationId = extractOrganizationId(event);

			const { checkoutUrl } = await createSubscription(event, {
				organizationId,
				...event.body
			});
			throw redirect(303, checkoutUrl);
		}
	)
};
