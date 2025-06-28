import { errorStr } from '$lib/utils/error';
import type { ResponseStreamEvent } from 'openai/resources/responses/responses.mjs';

export async function parseStream(
	res: Response,
	onEvent: (chunk: ResponseStreamEvent) => Promise<void>,
	onError: (error: Error) => void
) {
	async function processChunk(chunk: string) {
		if (!chunk.trim()) return;
		try {
			const parsed = JSON.parse(chunk) as ResponseStreamEvent;
			await onEvent(parsed);
		} catch (error) {
			onError(new Error(errorStr(error)));
		}
	}

	if (!res.ok) {
		const error = await res.json();
		console.log('Error parsing stream', { error, message: error?.message, errorStr: errorStr(error) });

		return onError(new Error(error?.message || 'Unknown error'));
	}

	const reader = res.body?.getReader();
	if (!reader) throw new Error('No reader available');

	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const chunks = buffer.split('\n');
		buffer = chunks.pop() || '';

		for (const chunk of chunks) {
			await processChunk(chunk);
		}
	}

	await processChunk(buffer);
}
