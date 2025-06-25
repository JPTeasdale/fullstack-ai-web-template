import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PostHog } from 'posthog-node';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import { URL_POSTHOG_PROXY } from '$lib/url';

import { OPENAI_API_KEY } from '$env/static/private';
import { OpenAI } from '@posthog/ai';

import { SESClient } from '@aws-sdk/client-ses';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';
import { getPosthog } from '../clients/posthog';
import { dev } from '$app/environment';

export const posthog: Handle = async ({ event, resolve }) => {
	event.locals.posthog = getPosthog();

	//
	const res = await resolve(event);

	event.locals.posthog.shutdown();
	return res;
};

export const posthogProxy: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname.startsWith(URL_POSTHOG_PROXY)) {
		// Determine target hostname based on static or dynamic ingestion
		const hostname = pathname.startsWith(`${URL_POSTHOG_PROXY}/static/`)
			? 'us-assets.i.posthog.com' // change us to eu for EU Cloud
			: 'us.i.posthog.com'; // change us to eu for EU Cloud

		// Build external URL
		const url = new URL(event.request.url);
		url.protocol = 'https:';
		url.hostname = hostname;
		url.port = '443';
		url.pathname = pathname.replace(`${URL_POSTHOG_PROXY}/`, '');

		// Clone and adjust headers
		const headers = new Headers(event.request.headers);
		headers.set('host', hostname);

		// Proxy the request to the external host
		const response = await fetch(url.toString(), {
			method: event.request.method,
			headers,
			body: event.request.body,
			duplex: 'half'
		} as RequestInit);

		return response;
	}

	const response = await resolve(event);
	return response;
};

export const openai: Handle = async ({ event, resolve }) => {
	event.locals.openai = new OpenAI({
		apiKey: OPENAI_API_KEY,
		posthog: event.locals.posthog
	});

	return resolve(event);
};

export const ses: Handle = async ({ event, resolve }) => {
	event.locals.ses = new SESClient({
		region: 'us-west-1',
		credentials: {
			accessKeyId: AWS_ACCESS_KEY_ID,
			secretAccessKey: AWS_SECRET_ACCESS_KEY
		}
	});

	return resolve(event);
};

export const r2: Handle = async ({ event, resolve }) => {
	if (!event.platform?.env.FILE_STORAGE) {
		throw new Error('R2 bucket not found in platform environment');
	}

	event.locals.r2 = event.platform?.env.FILE_STORAGE;

	return resolve(event);
};

export const rateLimiter: Handle = async ({ event, resolve }) => {
	const userId = event.locals.user?.id;
	const platform = event.platform;
	if (!userId || !platform) {
		return resolve(event);
	}

	const id = platform.env.RATE_LIMITER.idFromName(userId);
	const limiter = platform.env.RATE_LIMITER.get(id);

	event.locals.rateLimit = (plan: string) => {
		if (dev) {
			console.warn('Rate limiting disabled in dev');

			return {
				allowed: true
			};
		}
		try {
			return limiter.isAllowed(plan);
		} catch (error) {
			console.error('Error getting rate limiter', error);
			return {
				allowed: true
			};
		}
	};

	return resolve(event);
};

export const hookClients = sequence(posthog, posthogProxy, openai, ses, r2, rateLimiter);
