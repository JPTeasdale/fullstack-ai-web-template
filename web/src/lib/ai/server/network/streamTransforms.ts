import type {
	AiFunctionCallDefinitions,
	FunctionCallMap,
	OpenAiResponseStreamEvent
} from '$lib/ai/types';
import { applyOutputItemFormat } from './applyOutputItemFormat';
import { isServerFunction, processServerFunctionCall } from './serverFunctionCalls';
import type { TransformFunction } from './streamResponse';

export function callFunctionTransform<T extends AiFunctionCallDefinitions>(
	fnCallMap?: FunctionCallMap<T>
): TransformFunction {
	return async (chunk: OpenAiResponseStreamEvent) => {
		if (!fnCallMap) {
			return chunk;
		}

		if (chunk.type === 'response.output_item.added' && chunk.item.type === 'function_call') {
			const callOnServer = isServerFunction(chunk.item.name, fnCallMap);

			chunk.item.meta = {
				call_from_server: callOnServer
			};
		} else if (chunk.type === 'response.output_item.done' && chunk.item.type === 'function_call') {
			await processServerFunctionCall(chunk.item, fnCallMap);
		}

		return chunk;
	};
}

export function setOutputItemFormattedTypeTransform(formattedType?: string): TransformFunction {
	return async (chunk: OpenAiResponseStreamEvent) => {
		if (!formattedType) {
			return chunk;
		}

		switch (chunk.type) {
			case 'response.content_part.added':
			case 'response.content_part.done':
				if (chunk.part.type === 'output_text') {
					chunk.part.formattedType = formattedType;
				}
				break;
			case 'response.output_item.done':
				chunk.item = applyOutputItemFormat(chunk.item, formattedType);
				break;
			default:
				break;
		}

		return chunk;
	};
}
