import type { AiRequestBody } from '../types';

export const fetchAi = async (apiPath: string, body?: AiRequestBody) => {
	return await fetch(apiPath, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body ?? {})
	});
};
