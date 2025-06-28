import { UnauthorizedError, ValidationError, RateLimitError, NotFoundError } from '$lib/errors';
import type { RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';
import { addMilliseconds, differenceInMilliseconds, isAfter, subMilliseconds } from 'date-fns';
import type { M } from 'vitest/dist/chunks/reporters.d.DL9pg5DB.js';

/**
 * Create an API handler with automatic error handling
 */
export function createApiHandler<T = any>(
	handler: (event: RequestEvent & { validated?: T }) => Promise<Response>
) {
	return async (event: RequestEvent) => {
		return await handler(event);
	};
}

/**
 * Create an API handler with request validation
 */
export function createValidatedApiHandler<T extends z.ZodType>(
	schema: T,
	handler: (event: RequestEvent & { validated: z.infer<T> }) => Promise<Response>
) {
	return createApiHandler(async (event) => {
		const data = await event.request.json();
		const result = schema.safeParse(data);

		if (!result.success) {
			const errors: Record<string, string[]> = {};
			result.error.errors.forEach((err) => {
				const path = err.path.join('.');
				if (!errors[path]) errors[path] = [];
				errors[path].push(err.message);
			});

			throw new ValidationError('Validation failed', errors);
		}

		return handler({ ...event, validated: result.data });
	});
}

/**
 * Require user authentication
 */
export async function requireAuth(event: RequestEvent) {
	const { user } = event.locals;

	if (!user) {
		throw new UnauthorizedError();
	}

	return user;
}

/**
 * Parse and validate FormData file upload
 */
export async function parseFileUpload(request: Request, fieldName = 'file'): Promise<File> {
	const formData = await request.formData();
	const file = formData.get(fieldName) as File | null;

	if (!file) {
		throw new ValidationError(`${fieldName} is required in FormData`);
	}

	if (!file.size) {
		throw new ValidationError('File cannot be empty');
	}

	return file;
}

const RATE_LIMIT_CONFIG = {
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


function createRateLimitFunction(
	table: 'user_private' | 'organization_private',
	id_field: 'user_id' | 'organization_id'
) {
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

		const config = RATE_LIMIT_CONFIG[data.plan];

		if (!config) {
			throw new NotFoundError('Rate limit config not found');
		}

		const nextRefill = addMilliseconds(data.call_tokens_last_refill, config.refillFrequencyMs);

		const now = Date.now();
		if (isAfter(now, nextRefill)) {
			const newTokens = Math.min(data.call_tokens_remaining + config.refillAmount, config.capacity);

			// Ensure we don't steal time from the user by overwriting remainder time
			const elapsedMs = differenceInMilliseconds(now, data.call_tokens_last_refill);
			const remainingMs = elapsedMs % config.refillFrequencyMs;
			await event.locals.supabaseAdmin
				.from(table)
				.update({
					call_tokens_remaining: newTokens - 1,
					call_tokens_last_refill: subMilliseconds(now, remainingMs).toISOString()
				})
				.eq(id_field, id);

			return;
		}

		if (data.call_tokens_remaining <= 0) {
			throw new RateLimitError('user', nextRefill.toISOString(), config.capacity);
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

export const checkUserRateLimit = createRateLimitFunction('user_private', 'user_id');
export const checkOrganizationRateLimit = createRateLimitFunction('organization_private', 'organization_id');
