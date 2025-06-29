import type { Enums } from "$lib/types/generated/supabase.types";

export const APP_NAME = 'Free Production-Ready AI Web Template';

export const APP_SUBSCRIPTION_PLAN_TYPES = {
	basic: {
		name: 'Basic',
		fromPrice: 100 / 12,
		popular: false,
		description: 'for getting started',
		features: [
			'Up to 10 team members',
			'5GB storage',
			'Basic analytics',
			'Email support',
			'Standard integrations'
		],
		intervals: [
			{ id: 'basic_weekly', name: 'Weekly', price: 5, interval: 'week' },
			{ id: 'basic_monthly', name: 'Monthly', price: 10, interval: 'month' },
			{ id: 'basic_yearly', name: 'Yearly', price: 100, interval: 'year' }
		]
	},
	pro: {
		name: 'Pro',
		fromPrice: 250 / 12,
		popular: true,
		description: 'for growing teams',
		features: [
			'Unlimited team members',
			'100GB storage',
			'Advanced analytics & insights',
			'Priority email & chat support',
			'All integrations',
			'Custom workflows',
			'API access'
		],
		intervals: [
			{ id: 'pro_weekly', name: 'Weekly', price: 10, interval: 'week' },
			{ id: 'pro_monthly', name: 'Monthly', price: 25, interval: 'month' },
			{ id: 'pro_yearly', name: 'Yearly', price: 250, interval: 'year' }
		]
	}
} as const;

export const APP_SUBSCRIPTION_INTERVAL_IDS: Enums<'app_subscription_type'>[] = Object.values(APP_SUBSCRIPTION_PLAN_TYPES).flatMap(
	(plan) => plan.intervals.flatMap((interval) => interval.id)
);

export const APP_RATE_LIMIT_CONFIG = {
	free: {
		capacity: 10,
		refillAmount: 1,
		refillFrequencyMs: 60 * 60 * 1000
	},
	basic: {
		capacity: 100,
		refillAmount: 10,
		refillFrequencyMs: 60 * 60 * 1000
	},
	pro: {
		capacity: 1000,
		refillAmount: 100,
		refillFrequencyMs: 60 * 60 * 1000
	}
};