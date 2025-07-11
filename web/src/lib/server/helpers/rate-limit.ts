import { APP_RATE_LIMIT_CONFIG } from '$lib/app/constants';
import { NotFoundError, RateLimitError, UnauthorizedError } from '$lib/server/errors';
import type { RequestEvent } from '@sveltejs/kit';
import { differenceInMilliseconds, subMilliseconds } from 'date-fns';
import { addMilliseconds } from 'date-fns';

function createRateLimitFunction(resource: 'user' | 'organization') {
	const table = `${resource}_private` as const;
	const id_field = `${resource}_id` as const;

	return async (event: RequestEvent, id?: string) => {
		if (!id) {
			throw new UnauthorizedError();
		}

		const { data } = await event.locals.supabaseAdmin
			.from(table)
			.select('plan, call_tokens_remaining, call_tokens_last_refill')
			.eq(id_field, id)
			.single();

		if (!data) {
			throw new NotFoundError('Organization not found');
		}

		const config = APP_RATE_LIMIT_CONFIG[data.plan];

		if (!config) {
			throw new NotFoundError('Rate limit config not found');
		}

		const now = Date.now();
		const elapsedMs = differenceInMilliseconds(now, data.call_tokens_last_refill);
		const refillCycles = Math.floor(elapsedMs / config.refillFrequencyMs);
		const nextRefill = addMilliseconds(data.call_tokens_last_refill, config.refillFrequencyMs);

		if (refillCycles > 0) {
			const newTokenAmount = Math.min(
				data.call_tokens_remaining + refillCycles * config.refillAmount,
				config.capacity
			);

			// Keep the remainder time to make sure we don't steal time from the user
			const remainingMs = elapsedMs % config.refillFrequencyMs;
			await event.locals.supabaseAdmin
				.from(table)
				.update({
					call_tokens_remaining: newTokenAmount - 1,
					call_tokens_last_refill: subMilliseconds(now, remainingMs).toISOString()
				})
				.eq(id_field, id);

			return;
		}

		if (data.call_tokens_remaining <= 0) {
			throw new RateLimitError(resource, nextRefill.toISOString(), config.capacity);
		}

		await event.locals.supabaseAdmin
			.from(table)
			.update({
				call_tokens_remaining: data.call_tokens_remaining - 1
			})
			.eq(id_field, id);

		return;
	};
}
/**
 * Check rate limit with custom error
 */

export const checkUserRateLimit = createRateLimitFunction('user');
export const checkOrganizationRateLimit = createRateLimitFunction('organization');
