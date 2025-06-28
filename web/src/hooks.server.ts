import { sequence } from '@sveltejs/kit/hooks';
import { apiAuth as hookApi } from '$lib/server/svelte_handlers/hook_api';
import { hookDisableDevTools } from '$lib/server/svelte_handlers/hook_disable_devtools';
import { hookSupabaseSession } from '$lib/server/svelte_handlers/hook_supabase';
import { hookRedirects } from '$lib/server/svelte_handlers/hook_redirects';
import { hookClients } from '$lib/server/svelte_handlers/hook_clients';
import { getPosthog } from '$lib/server/clients/posthog';

import type { HandleServerError } from '@sveltejs/kit';
import { throwApiError } from '$lib/errors';

export const handleError: HandleServerError = async ({ error, status, event, message }) => {
	const requestId = (event.locals as any).requestId || 'unknown';
	const userId = event.locals.user?.id;

	if (status !== 404) {
		console.error(`[${requestId}] Server Error:`, {
			status,
			message,
			error:
				error instanceof Error
					? {
							name: error.name,
							message: error.message,
							stack: error.stack
						}
					: error,
			path: event.url.pathname,
			method: event.request.method,
			userId
		});

		try {
			const posthog = event.locals.posthog || getPosthog();
			if (posthog) {
				posthog.captureException(error);
				await posthog.shutdown();
			}
		} catch (err) {
			console.error('Error capturing error in posthog', err);
		}
	}

	throwApiError(error);
};

export const handle = sequence(
	// // Logging and monitoring
	// createRequestLogger(),
	// createPerformanceMonitor(),
	// createApiLogger(),

	// Core functionality
	hookSupabaseSession,
	hookClients,
	hookApi,
	hookDisableDevTools,
	hookRedirects
);
