import { json, type RequestEvent } from '@sveltejs/kit';
import type { ResponseCreateParams, ResponseInput } from 'openai/resources/responses/responses';
import type { AiRequestBody, AiFunctionCallDefinitions, FunctionCallMap } from '../types';
import { streamResponse } from './network/streamResponse';
import { Stream } from 'openai/streaming';
import { processServerFunctionCall } from './network/serverFunctionCalls';

interface LLMOptions<T extends RequestEvent, F extends AiFunctionCallDefinitions> {
	getInitialSystemPrompt: (event: T) => Promise<string>;
	getInitialUserPrompt: (prompt: string | null, event: T) => Promise<string>;
	functionCallMap?: FunctionCallMap<F>;
	openai: Omit<ResponseCreateParams, 'input'>;
}

export async function handleLlmRequest<
	T extends RequestEvent,
	F extends AiFunctionCallDefinitions = never
>(event: T, opts: LLMOptions<T, F>) {
	const { openai } = event.locals;
	const requestBody = (await event.request.json()) as AiRequestBody;

	const fnCallResults = requestBody.fnCallResults || [];
	const prompt = requestBody.prompt || null;

	const input: ResponseInput = fnCallResults.map((toolResult) => ({
		type: 'function_call_output',
		call_id: toolResult.callId,
		output: JSON.stringify(toolResult.result)
	}));

	if (!requestBody.previousResponseId) {
		const [systemPrompt, userPrompt] = await Promise.all([
			opts.getInitialSystemPrompt(event),
			opts.getInitialUserPrompt(prompt, event)
		]);
		if (systemPrompt) {
			input.push({
				role: 'developer',
				content: systemPrompt
			});
		}
		if (userPrompt) {
			input.push({
				role: 'user',
				content: userPrompt
			});
		}
	} else if (prompt) {
		input.push({
			role: 'user',
			content: prompt
		});
	}
	try {
		const response = await openai.responses.create({
			previous_response_id: requestBody.previousResponseId,
			input,
			...opts.openai
		});

		if (response instanceof Stream) {
			return streamResponse(response, opts.functionCallMap);
		} else {
			for (const item of response.output) {
				if (item.type === 'function_call' && opts.functionCallMap) {
					await processServerFunctionCall(item, opts.functionCallMap);
				}
			}
			return json(response);
		}
	} catch (error) {
		console.error('handleLlmRequest error', error);
		return new Response('Error', { status: 500 });
	}
}
