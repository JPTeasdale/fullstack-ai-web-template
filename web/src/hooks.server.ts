import { sequence } from '@sveltejs/kit/hooks';
import { hookApi } from '$lib/server/svelte_handlers/hook_api';
import { hookDisableDevTools } from '$lib/server/svelte_handlers/hook_disable_devtools';
import { hookSupabaseSession } from '$lib/server/svelte_handlers/hook_supabase';
import { hookRedirects } from '$lib/server/svelte_handlers/hook_redirects';
import { hookClients } from '$lib/server/svelte_handlers/hook_clients';
import { getPosthog } from '$lib/server/clients/posthog';

import type { Handle, HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({
	error,
	status,
	event: {
		locals: { posthog }
	}
}) => {
	if (status !== 404) {
		console.error(error);

		try {
			if (posthog) {
				posthog.captureException(error);
				await posthog.shutdown();
			} else {
				const posthog = getPosthog();
				posthog.captureException(error);
				await posthog.shutdown();
			}
		} catch (error) {
			console.error('Error capturing error in posthog', error);
		}
	}
};

const log: Handle = async ({ event, resolve }) => {
	console.log(event.url.href);

	return resolve(event);
};

export const handle = sequence(
	log,
	hookSupabaseSession,
	hookClients,
	hookApi,
	hookDisableDevTools,
	hookRedirects
);
