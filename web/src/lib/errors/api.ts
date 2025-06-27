import { error as svelteKitError } from '@sveltejs/kit';
import {
	NotFoundError,
	OperationError,
	ServiceUnavailableError,
	UnauthorizedError,
	ForbiddenError,
	ValidationError,
	RateLimitError,
	ConflictError,
	PayloadTooLargeError,
	ConfigurationError
} from './index';

/**
 * Converts application errors to appropriate HTTP errors
 * @param err - The error to convert
 * @param fallbackMessage - Optional fallback message for unknown errors
 * @returns Never (always throws)
 */
export function throwApiError(err: unknown, fallbackMessage = 'Internal server error'): never {
	// Handle our custom error types
	if (err instanceof NotFoundError) {
		throw svelteKitError(404, err.message);
	}

	if (err instanceof UnauthorizedError) {
		throw svelteKitError(401, err.message);
	}

	if (err instanceof ForbiddenError) {
		throw svelteKitError(403, err.message);
	}

	if (err instanceof ValidationError) {
		// Include field errors in the response if available
		const message = err.fields
			? JSON.stringify({ message: err.message, errors: err.fields })
			: err.message;
		throw svelteKitError(400, message);
	}

	if (err instanceof RateLimitError) {
		const message = JSON.stringify({
			message: err.message,
			limit: err.limit,
			resetTime: err.resetTime?.toISOString()
		});
		throw svelteKitError(429, message);
	}

	if (err instanceof ConflictError) {
		throw svelteKitError(409, err.message);
	}

	if (err instanceof PayloadTooLargeError) {
		throw svelteKitError(413, err.message);
	}

	if (err instanceof ConfigurationError) {
		console.error(`Configuration error: ${err.configKey}`, err.message);
		throw svelteKitError(500, 'Server configuration error');
	}

	if (err instanceof ServiceUnavailableError) {
		console.error(`Service unavailable: ${err.service}`, err.message);
		throw svelteKitError(503, err.message);
	}

	if (err instanceof OperationError) {
		// Log the error with context for monitoring
		console.error(`Operation error (${err.operation}):`, err.message, err.context);

		// Map specific operations to appropriate status codes
		if (err.operation.startsWith('database')) {
			throw svelteKitError(500, 'Database operation failed');
		}
		if (err.operation.startsWith('validation')) {
			throw svelteKitError(400, err.message);
		}
		if (err.operation.startsWith('auth')) {
			throw svelteKitError(401, err.message);
		}

		// Default to 500 for other operation errors
		throw svelteKitError(500, 'Operation failed');
	}

	// Handle other known error types
	if (err instanceof Error) {
		console.error('Unexpected error:', err);

		// Check for specific error messages or codes that might indicate status
		const message = err.message.toLowerCase();
		if (message.includes('unauthorized') || message.includes('unauthenticated')) {
			throw svelteKitError(401, 'Unauthorized');
		}
		if (message.includes('forbidden') || message.includes('permission')) {
			throw svelteKitError(403, 'Forbidden');
		}
		if (message.includes('not found')) {
			throw svelteKitError(404, 'Not found');
		}
		if (message.includes('rate limit')) {
			throw svelteKitError(429, 'Too many requests');
		}
		if (message.includes('conflict') || message.includes('duplicate')) {
			throw svelteKitError(409, 'Conflict');
		}

		throw svelteKitError(500, fallbackMessage);
	}

	// For completely unknown errors
	console.error('Unknown error type:', err);
	throw svelteKitError(500, fallbackMessage);
}

/**
 * Wraps an async function to automatically convert errors to API errors
 * @param fn - The async function to wrap
 * @returns The wrapped function
 */
export function withApiErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
	return (async (...args: Parameters<T>) => {
		try {
			return await fn(...args);
		} catch (err) {
			throwApiError(err);
		}
	}) as T;
}

/**
 * Type guard to check if an error has a specific code
 */
export function hasErrorCode(err: unknown): err is { code: string } {
	return typeof err === 'object' && err !== null && 'code' in err;
}

/**
 * Type guard to check if an error has a specific status
 */
export function hasErrorStatus(err: unknown): err is { status: number } {
	return typeof err === 'object' && err !== null && 'status' in err;
}
