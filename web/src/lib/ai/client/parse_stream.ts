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
			if (error instanceof Error) {
				onError(error);
			} else {
				onError(new Error(String(error)));
			}
		}
	}

	if (!res.ok) {
		return onError(new Error(res.statusText));
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
