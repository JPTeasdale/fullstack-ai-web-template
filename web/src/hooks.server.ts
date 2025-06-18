import { sequence } from '@sveltejs/kit/hooks';
import { hookApi } from '$lib/server/svelte_handlers/hook_api';
import { hookDisableDevTools } from '$lib/server/svelte_handlers/hook_disable_devtools';
import { hookSupabaseSession } from '$lib/server/svelte_handlers/hook_supabase';
import { hookRedirects } from '$lib/server/svelte_handlers/hook_redirects';
import { hookClients } from '$lib/server/svelte_handlers/hook_clients';

import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = async ({ error, status, event: { locals: { posthog } } }) => {
	if (status !== 404) {
		console.error(error);

		posthog.captureException(error);
		await posthog.shutdown();
	}
};

export const handle = sequence(
	hookClients,
	hookSupabaseSession,
	hookApi,
	hookDisableDevTools,
	hookRedirects
);
