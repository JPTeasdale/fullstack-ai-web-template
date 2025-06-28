import { handleLlmRequest } from '$lib/ai/server/serverLlmRequest';
import { getOrganization } from '$lib/models/organizations';
import { requireAuth, checkOrganizationRateLimit, createValidatedApiHandler } from '$lib/server/api/helpers';
import type { AuthenticatedContext } from '$lib/models/context';
import type { Tool } from 'openai/resources/responses/responses.mjs';
import { aiRequestSchema } from '$lib/schemas/ai';

export const POST = createValidatedApiHandler(aiRequestSchema, async (event) => {
	const { orgId } = event.params;

	// Ensure user is authenticated
	await requireAuth(event);

	// Create context
	const ctx: AuthenticatedContext = { 
		...event.locals, 
		user: event.locals.user! 
	};

	// Get organization using model function
	const organization = await getOrganization(ctx, orgId!);

	await checkOrganizationRateLimit(event, orgId!);

	// Build tools array based on organization configuration
	let tools: Tool[] = [];
	if (organization.openai_vector_store_id) {
		tools.push({
			type: 'file_search',
			vector_store_ids: [organization.openai_vector_store_id]
		});
	}

	// Handle the LLM request with the organization context
	return await handleLlmRequest(event.validated, {
		async getInitialSystemPrompt() {
			return '';
		},
		async getInitialUserPrompt({prompt}) {
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
