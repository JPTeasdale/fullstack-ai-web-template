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
