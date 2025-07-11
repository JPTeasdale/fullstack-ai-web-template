import type { RequestEvent } from '@sveltejs/kit';
import type { AppSupabaseClient } from '$lib/types/app.types';
import { ConfigurationError, UnauthorizedError } from '$lib/server/errors';

/**
 * Base context with essential services
 */
export interface BaseContext extends RequestEvent {}

/**
 * Context for authenticated requests
 */
export interface AuthenticatedEvent extends RequestEvent {
	locals: RequestEvent['locals'] & {
		supabaseAdmin: AppSupabaseClient;
		user: { id: string; email?: string };
	};
}

export function assertAuthenticated(event: RequestEvent): asserts event is AuthenticatedEvent {
	if (!event.locals.user) {
		throw new UnauthorizedError('User not authenticated');
	}
}

export function extractOrganizationId(event: RequestEvent): string {
	assertAuthenticated(event);
	if (!event.params.orgId) {
		throw new ConfigurationError('Organization ID is required');
	}
	return event.params.orgId;
}

export function extractR2(event: AuthenticatedEvent): R2Bucket {
	if (!event.platform?.env.FILE_STORAGE) {
		throw new ConfigurationError('R2 bucket not found in platform environment');
	}
	return event.platform.env.FILE_STORAGE;
}
