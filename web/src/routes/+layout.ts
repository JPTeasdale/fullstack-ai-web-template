import { isBrowser } from '@supabase/ssr';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import type { LayoutLoad } from './$types';
import posthog from 'posthog-js';
import { URL_POSTHOG_PROXY } from '$lib/url';

export const ssr = true;

export const load: LayoutLoad = async ({ data }) => {
	if (isBrowser()) {
		posthog.init(PUBLIC_POSTHOG_KEY, {
			api_host: URL_POSTHOG_PROXY,
			ui_host: 'https://us.posthog.com',
			persistence: 'localStorage',
			person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
		});
	}

	return { user: data.user };
};
