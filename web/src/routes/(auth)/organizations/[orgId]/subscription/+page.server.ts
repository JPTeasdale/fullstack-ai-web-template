import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { 
	createAuthenticatedActionHandler, 
	createAuthenticatedValidatedActionHandler 
} from '$lib/server/actions/helpers';
import {
	createSubscriptionSchema,
} from '$lib/schemas/subscriptions';
import {
	getOrganizationSubscription,
	processCheckoutSuccess,
	createSubscription,
	cancelSubscription,
	reactivateSubscription,
	createPaymentUpdateSession
} from '$lib/models/subscriptions';
import type { OrgContext } from '$lib/models/context';

export const load: PageServerLoad = async ({ locals, url, params }) => {
	const { user } = locals;
	if (!user) {
		throw redirect(302, '/auth/signin');
	}

	if (!params.orgId) {
		throw redirect(302, '/dashboard');
	}

	const ctx: OrgContext = {
		...locals,
		user,
		organizationId: params.orgId!
	} as OrgContext;

	// Check for success parameters from Stripe
	const checkoutSessionId = url.searchParams.get('payment_intent');
	const success = url.searchParams.get('success');

	// Process checkout success if session ID is present
	if (checkoutSessionId) {
		await processCheckoutSuccess(ctx, checkoutSessionId);
	}

	// Get subscription and price info
	const { subscription, priceInfo } = await getOrganizationSubscription(ctx);

	return {
		subscription,
		priceInfo,
		checkoutSuccess: !!checkoutSessionId || success === 'true'
	};
};

export const actions: Actions = {
	cancel: createAuthenticatedActionHandler(async ({ ctx, params }) => {
		if (!params.orgId) {
			throw new Error('Organization ID is required');
		}

		const orgCtx: OrgContext = {
			...ctx,
			organizationId: params.orgId!
		};

		await cancelSubscription(orgCtx);
		return { success: true };
	}),

	reactivate: createAuthenticatedActionHandler(async ({ ctx, params }) => {
		if (!params.orgId) {
			throw new Error('Organization ID is required');
		}

		const orgCtx: OrgContext = {
			...ctx,
			organizationId: params.orgId!
		};

		await reactivateSubscription(orgCtx);
		return { success: true };
	}),

	updatePaymentMethod: createAuthenticatedActionHandler(async ({ ctx, params, request }) => {
		if (!params.orgId) {
			throw new Error('Organization ID is required');
		}

		const orgCtx: OrgContext = {
			...ctx,
			organizationId: params.orgId!
		};

		const { checkoutUrl } = await createPaymentUpdateSession(orgCtx, request.url);
		throw redirect(303, checkoutUrl);
	}),

	createSubscription: createAuthenticatedValidatedActionHandler(
		createSubscriptionSchema,
		async ({ ctx, params, body, url }) => {
			if (!params.orgId) {
				throw new Error('Organization ID is required');
			}

			const { checkoutUrl } = await createSubscription(
				ctx,
				params.orgId!,
				body,
				url.origin
			);
			throw redirect(303, checkoutUrl);
		}
	)
};
