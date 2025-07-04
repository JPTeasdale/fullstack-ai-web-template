import { ValidationError } from '$lib/server/errors';
import type { RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';

import { assertAuthenticated, extractOrganizationId, type AuthenticatedEvent } from './context';

/**
 * Create an API handler with automatic error handling
 */
export function createApiHandler(handler: (event: AuthenticatedEvent) => Promise<Response>) {
	return async (event: RequestEvent) => {
		assertAuthenticated(event);
		return await handler(event);
	};
}

/**
 * Create an API handler with automatic error handling
 */
export function createOrganizationApiHandler(
	handler: (event: AuthenticatedEvent & { organizationId: string }) => Promise<Response>
) {
	return async (event: RequestEvent) => {
		assertAuthenticated(event);
		const organizationId = extractOrganizationId(event);
		await event.locals.supabase.rpc('set_current_organization_id', {
			org_id: organizationId
		});
		return await handler({ ...event, organizationId });
	};
}

/**
 * Create an API handler with request validation
 */
export function createValidatedApiHandler<T extends z.ZodType>(
	schema: T,
	handler: (event: AuthenticatedEvent & { validated: z.infer<T> }) => Promise<Response>
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
 * Create an API handler with request validation
 */
export function createValidatedOrganizationApiHandler<T extends z.ZodType>(
	schema: T,
	handler: (
		event: AuthenticatedEvent & { organizationId: string; validated: z.infer<T> }
	) => Promise<Response>
) {
	return createOrganizationApiHandler(async (event) => {
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
