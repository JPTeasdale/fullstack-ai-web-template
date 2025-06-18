import { handleLlmRequest } from '$lib/ai/server/serverLlmRequest';
import type { RequestEvent } from './$types';
import { formatTodoList } from '$lib/ai/schemas/todo_example_schema';
import {
	createTodoFunction,
	updateTodoFunction
} from '$lib/ai/functions/todo_example_function_call';

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
			stream: true,
			tools: [createTodoFunction, updateTodoFunction],
			text: {
				format: formatTodoList
			}
		}
	});
}
