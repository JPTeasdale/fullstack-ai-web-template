import { z } from 'zod';

// Subscription action schemas
export const createSubscriptionSchema = z.object({
	plan: z.enum(['basic_weekly', 'basic_yearly', 'pro_weekly', 'pro_yearly'], {
		errorMap: () => ({ message: 'Please select a valid subscription plan' })
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
