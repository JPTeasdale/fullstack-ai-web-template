import posthog from 'posthog-js';
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ error, status }) => {
	console.error(error);

	if (status !== 404) {
		posthog.captureException(error);
	}
};
