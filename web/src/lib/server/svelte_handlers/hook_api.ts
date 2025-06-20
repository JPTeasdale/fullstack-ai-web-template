import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { URL_API_ROOT, URL_API_V1_ROOT } from '$lib/url';
import { error } from 'console';

const cors: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith(URL_API_ROOT)) {
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': '*'
				}
			});
		}
	}
	const response = await resolve(event);
	if (event.url.pathname.startsWith(URL_API_ROOT)) {
		response.headers.append('Access-Control-Allow-Origin', '*');
	}
	return response;
};

export const apiAuth: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	// Check if the request is for the /api/v1/ path
	if (pathname.startsWith(URL_API_V1_ROOT)) {
		if (!event.locals.session) {
			return new Response('Unauthorized', { status: 401 });
		}
	}

	// Proceed with the request
	return resolve(event);
};

export const hookApi = sequence(cors, apiAuth);
