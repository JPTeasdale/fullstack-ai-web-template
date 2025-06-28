import { json, type RequestEvent } from '@sveltejs/kit';
import type { ResponseCreateParams, ResponseInput } from 'openai/resources/responses/responses';
import type { AiRequestBody, AiFunctionCallDefinitions, FunctionCallMap } from '../types';
import { streamResponse } from './network/streamResponse';
import { Stream } from 'openai/streaming';
import { processServerFunctionCall } from './network/serverFunctionCalls';
import {
	callFunctionTransform,
	setOutputItemFormattedTypeTransform
} from './network/streamTransforms';
import { applyOutputItemFormat } from './network/applyOutputItemFormat';
import OpenAI from 'openai';

interface LLMOptions<F extends AiFunctionCallDefinitions> {
	getInitialSystemPrompt: (requestBody: AiRequestBody) => Promise<string>;
	getInitialUserPrompt: (requestBody: AiRequestBody) => Promise<string>;
	client: OpenAI;
	functionCallMap?: FunctionCallMap<F>;
	openai: Omit<ResponseCreateParams, 'input'>;
	formattedType?: string;
}

export async function handleLlmRequest<F extends AiFunctionCallDefinitions = never>(
	requestBody: AiRequestBody,
	opts: LLMOptions<F>
) {
	const { client } = opts;

	const fnCallResults = requestBody.fnCallResults || [];
	const prompt = requestBody.prompt || null;

	const input: ResponseInput = fnCallResults.map((toolResult) => ({
		type: 'function_call_output',
		call_id: toolResult.callId,
		output: JSON.stringify(toolResult.result)
	}));

	if (!requestBody.previousResponseId) {
		const [systemPrompt, userPrompt] = await Promise.all([
			opts.getInitialSystemPrompt(requestBody),
			opts.getInitialUserPrompt(requestBody)
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
		const response = await client.responses.create({
			previous_response_id: requestBody.previousResponseId,
			input,
			...opts.openai
		});

		if (response instanceof Stream) {
			return streamResponse(response, [
				callFunctionTransform(opts.functionCallMap),
				setOutputItemFormattedTypeTransform(opts.formattedType)
			]);
		} else {
			for (const item of response.output) {
				if (item.type === 'function_call' && opts.functionCallMap) {
					await processServerFunctionCall(item, opts.functionCallMap);
				} else if (item.type === 'message') {
					applyOutputItemFormat(item, opts.formattedType);
				}
			}
			return json(response);
		}
	} catch (error) {
		console.error('handleLlmRequest error', error);
		return new Response('Error', { status: 500 });
	}
}
