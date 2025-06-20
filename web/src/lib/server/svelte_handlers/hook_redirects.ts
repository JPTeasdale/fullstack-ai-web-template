import { error, redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { URL_AUTH, URL_CONFIRM_EMAIL, URL_ROUTE_AUTHENTICATED, URL_SIGNIN } from '$lib/url';

const hookConfirmEmail: Handle = async ({ event, resolve }) => {
	const { user } = event.locals;
	if (user && !user.confirmed_at) {
		throw redirect(303, URL_CONFIRM_EMAIL);
	}

	return resolve(event);
};

const hookAuthGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = event.locals;

	const route = event.route?.id ?? '';

	if (!session && route.includes(URL_ROUTE_AUTHENTICATED)) {
		throw redirect(303, URL_SIGNIN);
	}

	if (session && route.includes(URL_AUTH)) {
		throw redirect(303, '/');
	}

	return resolve(event);
};

export const hookRedirects = sequence(hookConfirmEmail, hookAuthGuard);
