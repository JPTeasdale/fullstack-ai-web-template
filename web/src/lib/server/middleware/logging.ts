import type { Handle } from '@sveltejs/kit';

interface LogContext {
	requestId: string;
	method: string;
	path: string;
	userId?: string;
	organizationId?: string;
	duration?: number;
	status?: number;
	error?: string;
}

/**
 * Create a request logger middleware
 */
export const createRequestLogger = (): Handle => {
	return async ({ event, resolve }) => {
		if (event.url.pathname.startsWith('/api/')) {
			return resolve(event);
		}

		const start = Date.now();
		const requestId = crypto.randomUUID();

		// Add request ID to locals for tracing
		event.locals.trace = {
			requestId,
			organizationId: event.params.orgId
		};

		const logContext: LogContext = {
			...event.locals.trace,
			method: event.request.method,
			path: event.url.pathname
		};

		// Log request
		console.log(`[${requestId}] --> ${event.request.method} ${event.url.pathname}`);

		try {
			const response = await resolve(event);

			const duration = Date.now() - start;
			logContext.duration = duration;
			logContext.status = response.status;

			// Add user/org context if available
			if (event.locals.user?.id) {
				logContext.userId = event.locals.user.id;
			}

			// Log response
			const statusColor = response.status >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, green for success
			console.log(`[${requestId}] <-- ${statusColor}${response.status}\x1b[0m (${duration}ms)`);

			// Log detailed context for errors
			if (response.status >= 400) {
				console.error('[Request Error]', logContext);
			}

			return response;
		} catch (error) {
			const duration = Date.now() - start;
			logContext.duration = duration;
			logContext.error = error instanceof Error ? error.message : 'Unknown error';

			console.error(`[${requestId}] <-- ERROR (${duration}ms)`, error);
			console.error('[Request Error Context]', logContext);

			throw error;
		}
	};
};

/**
 * Create a performance monitoring middleware
 */
export const createPerformanceMonitor = (slowRequestThreshold = 1000): Handle => {
	return async ({ event, resolve }) => {
		const start = Date.now();

		const response = await resolve(event);

		const duration = Date.now() - start;

		// Log slow requests
		if (duration > slowRequestThreshold) {
			console.warn(
				`[SLOW REQUEST] ${event.request.method} ${event.url.pathname} took ${duration}ms`
			);
		}

		return response;
	};
};

/**
 * Create an API route logger specifically for /api routes
 */
export const createApiLogger = (): Handle => {
	return async ({ event, resolve }) => {
		// Only log API routes
		if (!event.url.pathname.startsWith('/api')) {
			return resolve(event);
		}

		const requestId = (event.locals as any).requestId || crypto.randomUUID();

		// Log request body for POST/PUT/PATCH
		if (['POST', 'PUT', 'PATCH'].includes(event.request.method)) {
			try {
				const contentType = event.request.headers.get('content-type');
				if (contentType?.includes('application/json')) {
					const body = await event.request.clone().text();
					const parsed = JSON.parse(body);
					// Remove sensitive data
					const sanitized = sanitizeLogData(parsed);
					console.log(`[${requestId}] Request Body:`, sanitized);
				}
			} catch (err) {
				// Ignore parsing errors
			}
		}

		const response = await resolve(event);

		// Log response body for errors
		if (response.status >= 400) {
			try {
				const contentType = response.headers.get('content-type');
				if (contentType?.includes('application/json')) {
					const body = await response.clone().text();
					console.log(`[${requestId}] Error Response:`, body);
				}
			} catch (err) {
				// Ignore parsing errors
			}
		}

		return response;
	};
};

/**
 * Sanitize sensitive data from logs
 */
function sanitizeLogData(data: any): any {
	if (!data || typeof data !== 'object') {
		return data;
	}

	const sensitive = ['password', 'token', 'secret', 'key', 'authorization'];
	const sanitized = { ...data };

	for (const key of Object.keys(sanitized)) {
		if (sensitive.some((s) => key.toLowerCase().includes(s))) {
			sanitized[key] = '[REDACTED]';
		} else if (typeof sanitized[key] === 'object') {
			sanitized[key] = sanitizeLogData(sanitized[key]);
		}
	}

	return sanitized;
}
