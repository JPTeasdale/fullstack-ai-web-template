import { handleLlmRequest } from '$lib/ai/server/serverLlmRequest';
import { getOrganization } from '$lib/server/models/organizations';
import { createValidatedOrganizationApiHandler } from '$lib/server/api/helpers';
import type { Tool } from 'openai/resources/responses/responses.mjs';
import { aiRequestSchema } from '$lib/schemas/ai';
import { checkOrganizationRateLimit } from '$lib/server/api/rate-limit';

export const POST = createValidatedOrganizationApiHandler(aiRequestSchema, async (event) => {
	const { organizationId } = event;
	const { supabaseAdmin } = event.locals;

	// Get organization using model function
	const organization = await getOrganization(event, organizationId);
	const { data: privateOrganization } = await supabaseAdmin
		.from('organization_private')
		.select('openai_vector_store_id')
		.eq('organization_id', organizationId)
		.maybeSingle();

	await checkOrganizationRateLimit(event, organizationId);

	// Build tools array based on organization configuration
	let tools: Tool[] = [];
	if (privateOrganization?.openai_vector_store_id) {
		tools.push({
			type: 'file_search',
			vector_store_ids: [privateOrganization.openai_vector_store_id]
		});
	}

	// Handle the LLM request with the organization context
	return await handleLlmRequest(event.validated, {
		async getInitialSystemPrompt() {
			return '';
		},
		async getInitialUserPrompt({ prompt }) {
			return prompt || '';
		},
		client: event.locals.openai,
		openai: {
			model: 'gpt-4.1',
			stream: true,
			tools
		}
	});
});
