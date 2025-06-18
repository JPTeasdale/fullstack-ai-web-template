import type {
	AiFunctionCallDefinitions,
	FunctionCallMap,
	OpenAiResponseStream,
	OpenAiResponseStreamEvent
} from '../../types';
import { isServerFunction, processServerFunctionCall } from './serverFunctionCalls';

export function streamResponse<T extends AiFunctionCallDefinitions>(
	stream: OpenAiResponseStream,
	functionCallMap?: FunctionCallMap<T>
) {
	const modifiedStream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			for await (const chunk of stream) {
				const processedChunk = await processChunk(chunk, functionCallMap);
				controller.enqueue(encoder.encode(JSON.stringify(processedChunk) + '\n'));
			}
			controller.close();
		}
	});

	return new Response(modifiedStream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
}

async function processChunk<T extends AiFunctionCallDefinitions>(
	chunk: OpenAiResponseStreamEvent,
	functionCallMap?: FunctionCallMap<T>
): Promise<OpenAiResponseStreamEvent> {
	// Call server funcitons if applicable
	if (functionCallMap) {
		if (chunk.type === 'response.output_item.added' && chunk.item.type === 'function_call') {
			const callOnServer = isServerFunction(chunk.item.name, functionCallMap);

			chunk.item.meta = {
				call_from_server: callOnServer
			};
		} else if (chunk.type === 'response.output_item.done' && chunk.item.type === 'function_call') {
			await processServerFunctionCall(chunk.item, functionCallMap);
		}
	}

	return chunk;
}
