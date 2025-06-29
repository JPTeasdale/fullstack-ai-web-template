import { APP_SUBSCRIPTION_INTERVAL_IDS } from '$lib/app/constants';
import { z } from 'zod';

// Subscription action schemas
export const createSubscriptionSchema = z.object({
	plan: z.string().refine((plan) => (APP_SUBSCRIPTION_INTERVAL_IDS as string[]).includes(plan), {
		message: 'Invalid plan'
	})
});

export const cancelSubscriptionSchema = z.object({});

export const reactivateSubscriptionSchema = z.object({});

export const updatePaymentMethodSchema = z.object({});

// Type inference
export type CreateSubscriptionData = z.infer<typeof createSubscriptionSchema>;
export type CancelSubscriptionData = z.infer<typeof cancelSubscriptionSchema>;
export type ReactivateSubscriptionData = z.infer<typeof reactivateSubscriptionSchema>;
export type UpdatePaymentMethodData = z.infer<typeof updatePaymentMethodSchema>;
