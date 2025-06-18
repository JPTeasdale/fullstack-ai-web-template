import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PostHog } from 'posthog-node';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';
import { URL_POSTHOG_PROXY } from '$lib/url';

import { OPENAI_API_KEY } from '$env/static/private';
import { OpenAI } from '@posthog/ai';

import { SESClient } from '@aws-sdk/client-ses';
import {
	AWS_ACCESS_KEY_ID,
	AWS_SECRET_ACCESS_KEY,
	CLOUDFLARE_R2_ACCESS_KEY,
	CLOUDFLARE_R2_SECRET_KEY
} from '$env/static/private';
import { S3Client } from '@aws-sdk/client-s3';

const posthog: Handle = async ({ event, resolve }) => {
	const posthog = new PostHog(PUBLIC_POSTHOG_KEY, {
		host: 'https://us.i.posthog.com'
	});
	event.locals.posthog = posthog;

	//
	const res = await resolve(event);

	await posthog.shutdown();

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

export const s3: Handle = async ({ event, resolve }) => {
	event.locals.s3 = new S3Client({
		region: 'auto',
		credentials: {
			accessKeyId: CLOUDFLARE_R2_ACCESS_KEY,
			secretAccessKey: CLOUDFLARE_R2_SECRET_KEY
		},
		requestChecksumCalculation: 'WHEN_REQUIRED',
		responseChecksumValidation: 'WHEN_REQUIRED'
	});

	return resolve(event);
};

export const hookClients = sequence(posthog, posthogProxy, openai, ses, s3);
