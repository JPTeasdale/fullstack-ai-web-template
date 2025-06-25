import { handleLlmRequest } from '$lib/ai/server/serverLlmRequest';
import { json } from '@sveltejs/kit';
import type { Tool } from 'openai/resources/responses/responses.mjs';
import type { RequestEvent } from './$types';

export async function POST(event: RequestEvent) {
	const { orgId } = event.params;
	const { supabase } = event.locals;

	const limiter = await event.locals.rateLimit('basic');
	if (!limiter?.allowed) {
		return json({ error: 'Rate limit exceeded' }, { status: 429 });
	}

	const { data: organization, error } = await supabase
		.from('organizations')
		.select('*')
		.eq('id', orgId)
		.single();

	if (error) {
		console.error(error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}

	let tools: Tool[] = [];
	if (organization.openai_vector_store_id) {
		tools.push({
			type: 'file_search',
			vector_store_ids: [organization.openai_vector_store_id]
		});
	}

	return await handleLlmRequest(event, {
		async getInitialSystemPrompt() {
			return '';
		},
		async getInitialUserPrompt(prompt: string | null) {
			return prompt || '';
		},
		openai: {
			model: 'gpt-4.1',
			stream: true,
			tools
		}
	});
}
