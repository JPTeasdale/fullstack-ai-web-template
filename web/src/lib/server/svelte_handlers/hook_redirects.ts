import { error, redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { URL_AUTH, URL_DASHBOARD, URL_ROUTE_AUTHENTICATED, URL_SIGNIN } from '$lib/url';

const hookAuthGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = event.locals;

	const route = event.route?.id ?? '';

	if (!session && route.includes(URL_ROUTE_AUTHENTICATED)) {
		throw redirect(303, URL_SIGNIN);
	}

	if (session && (route.includes(URL_AUTH) || route === '/')) {
		throw redirect(303, URL_DASHBOARD);
	}

	return resolve(event);
};

export const hookRedirects = sequence(hookAuthGuard);
