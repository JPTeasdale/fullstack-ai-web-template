import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { URL_API_ROOT } from '$lib/url';

export const cors: Handle = async ({ event, resolve }) => {
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

export const hookApi = sequence(cors);
