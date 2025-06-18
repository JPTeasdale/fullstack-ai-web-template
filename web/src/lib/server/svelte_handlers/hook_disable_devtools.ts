import type { Handle } from '@sveltejs/kit';

export const hookDisableDevTools: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/.well-known/appspecific/com.chrome.devtools')) {
		return new Response(null, { status: 204 });
	}
	return await resolve(event);
};
