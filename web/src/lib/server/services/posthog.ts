import { PostHog } from 'posthog-node';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';

export function getPosthog() {
	if (!PUBLIC_POSTHOG_KEY) {
		throw new Error('PUBLIC_POSTHOG_KEY is not set');
	}

	return new PostHog(PUBLIC_POSTHOG_KEY, {
		host: 'https://us.i.posthog.com'
	});
}
