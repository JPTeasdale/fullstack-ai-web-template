import type {
	AiFunctionCallDefinitions,
	FunctionCallMap,
	OpenAiResponseStream,
	OpenAiResponseStreamEvent
} from '../../types';
import { isServerFunction, processServerFunctionCall } from './serverFunctionCalls';

export type TransformFunction = (
	chunk: OpenAiResponseStreamEvent
) => Promise<OpenAiResponseStreamEvent>;

export function streamResponse(
	stream: OpenAiResponseStream,
	transforms?: TransformFunction[]
) {
	const modifiedStream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();
			for await (const chunk of stream) {
				let processedChunk = chunk;
				for (const transform of transforms || []) {
					processedChunk = await transform(processedChunk);
				}
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
