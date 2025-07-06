import { ValidationError } from '$lib/server/errors';
import { createApiErrorResponse } from '$lib/server/errors/api';
import type { RequestEvent } from '@sveltejs/kit';
import type { z } from 'zod';

import { assertAuthenticated, extractOrganizationId, type AuthenticatedEvent } from './context';
/**
 * Create an API handler with automatic error handling
 */
export function createApiHandler<T extends RequestEvent>(handler: (event: T) => Promise<Response>) {
	return async (event: T) => {
		try {
			return await handler(event);
		} catch (error) {
			return createApiErrorResponse(error);
		}
	};
}

export function createAuthenticatedApiHandler<T extends RequestEvent>(
	handler: (event: AuthenticatedEvent) => Promise<Response>
) {
	return createApiHandler(async (event) => {
		assertAuthenticated(event);
		return await handler(event);
	});
}

/**
 * Create an API handler with automatic error handling
 */
export function createOrganizationApiHandler(
	handler: (event: AuthenticatedEvent & { organizationId: string }) => Promise<Response>
) {
	return createAuthenticatedApiHandler(async (event) => {
		const organizationId = extractOrganizationId(event);
		await event.locals.supabase.rpc('set_current_organization_id', {
			org_id: organizationId
		});
		return await handler({ ...event, organizationId });
	});
}

export async function apiValidate<T extends z.ZodType>(
	schema: T,
	event: RequestEvent
): Promise<z.infer<T>> {
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

	return result.data;
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
