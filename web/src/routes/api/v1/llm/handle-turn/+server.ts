import { formatTodoList } from '$lib/ai/schemas/todo_example_schema';
import { handleLlmRequest } from '$lib/ai/server/serverLlmRequest';
import { aiRequestSchema } from '$lib/schemas/ai';
import { checkUserRateLimit, createValidatedApiHandler } from '$lib/server/api/helpers';

export const POST = createValidatedApiHandler(aiRequestSchema, async (event) => {
	await checkUserRateLimit(event, event.locals.user?.id);

	return await handleLlmRequest(event.validated, {
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
