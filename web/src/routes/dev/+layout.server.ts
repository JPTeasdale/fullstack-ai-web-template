import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	// In production, throw a 404 for all /dev routes
	// This will properly render the +error.svelte page
	if (!dev) {
		throw error(404, 'Not found');
	}

	// In development, allow the routes to load normally
	return {};
};
