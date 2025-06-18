import { handleLlmRequest } from '$lib/ai/server/serverLlmRequest';
import type { RequestEvent } from './$types';

export async function POST(params: RequestEvent) {
	return await handleLlmRequest(params, {
		async getInitialSystemPrompt() {
			return '';
		},
		async getInitialUserPrompt(prompt: string | null) {
			return prompt || '';
		},
		openai: {
			model: 'gpt-4.1',
			stream: true
		}
	});
}
