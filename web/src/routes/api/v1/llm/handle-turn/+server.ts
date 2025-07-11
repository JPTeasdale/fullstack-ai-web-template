import { formatTodoList } from '$lib/schemas/todo_example_schema';
import { handleLlmRequest } from '$lib/ai/server/serverLlmRequest';
import { aiRequestSchema } from '$lib/schemas/ai';
import { validateApi, createAuthenticatedApiHandler } from '$lib/server/helpers/api_helpers';
import { checkUserRateLimit } from '$lib/server/helpers/rate-limit';

export const POST = createAuthenticatedApiHandler(async (event) => {
	const validated = await validateApi(aiRequestSchema, event);

	await checkUserRateLimit(event, event.locals.user?.id);

	return await handleLlmRequest(validated, {
		async getInitialSystemPrompt() {
			return '';
		},
		async getInitialUserPrompt({ prompt }) {
			return prompt || '';
		},
		formattedType: 'todo_list',
		client: event.locals.openai,
		openai: {
			model: 'gpt-4.1',
			stream: true,
			text: {
				format: formatTodoList
			}
		}
	});
});
