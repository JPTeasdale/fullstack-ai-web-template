import { get, writable } from 'svelte/store';
import { errorStr } from '$lib/utils/error';
import { handleStreamEvents } from '$lib/ai/client/handle_stream_events';
import { zodDeepPartial } from 'zod-deep-partial';
import { parse as parsePartial } from 'partial-json';

import type {
	AppFunctionCallItem,
	AiToolResult,
	AiFunctionCallDefinitions,
	LocalFunctionCallResult,
	HandleFunctionCallFunction
} from '$lib/ai/types';
import { fetchAi } from '$lib/ai/client/fetch';
import type { z } from 'zod';

type AiObject = Record<string, unknown>;

interface PendingToolCall<F extends AiFunctionCallDefinitions> {
	tool: AppFunctionCallItem<F>;
	resolve: (s: string) => void;
}

type HandleResponseMeta = {
	apiPath: string;
};

type AiObjectStoreOptions<T extends AiObject, F extends AiFunctionCallDefinitions> = {
	initialObject?: T;
	handleAiFunctionCall: HandleFunctionCallFunction<F>;
};

export class AiObjectStore<T extends AiObject, F extends AiFunctionCallDefinitions> {
	readonly schema: z.ZodSchema<T>;
	readonly schemaPartial: z.ZodSchema<T>;
	readonly output = writable<T | null>(null);
	readonly generating = writable(false);
	readonly error = writable('');
	readonly previousResponseId = writable<string | null>(null);
	readonly analyzingFileId = writable<string | null>(null);
	readonly pendingToolCall = writable<PendingToolCall<F> | null>(null);
	readonly handleAiFunctionCall: (
		fnCall: AppFunctionCallItem<F>
	) => Promise<LocalFunctionCallResult>;

	constructor(schema: z.ZodSchema<T>, opts: AiObjectStoreOptions<T, F>) {
		this.schema = schema;
		this.schemaPartial = zodDeepPartial(schema);
		this.output.set(opts.initialObject || null);
		this.handleAiFunctionCall = opts.handleAiFunctionCall;
	}

	private handleResponse = async (res: Response, meta: HandleResponseMeta) => {
		const callResults: AiToolResult[] = [];

		await handleStreamEvents<F>(res, {
			onError: (error) => {
				const errStr = errorStr(error);
				console.warn('SETTING CONVERSATION ERROR:', {
					errStr
				});
				this.error.set(errStr);
			},
			onFunctionCall: async (fnCall) => {
				if (fnCall.call_id) {
					if (fnCall.meta.call_from_server) {
						callResults.push({
							callId: fnCall.call_id,
							result: JSON.stringify(fnCall.meta)
						});
					} else {
						try {
							const result = await this.handleAiFunctionCall(fnCall);
							if (result.requireUserConfirmation) {
								const confirmation = await new Promise<string>((r) => {
									const timeout = setTimeout(() => r('timeout'), 100000);
									const resolve = (str: string) => {
										clearTimeout(timeout);
										r(str);
									};
									this.pendingToolCall.set({
										tool: fnCall,
										resolve
									});
								});
								callResults.push({
									callId: fnCall.call_id,
									result: confirmation
								});
								this.pendingToolCall.set(null);
							} else {
								callResults.push({
									callId: fnCall.call_id,
									result: JSON.stringify(result.result)
								});
							}
						} catch (error) {
							callResults.push({
								callId: fnCall.call_id,
								result: JSON.stringify({ error: errorStr(error) })
							});
						}
					}
				}
			},
			onItemAdded: (item) => {
				if (item.type === 'message') {
					const content = item.content[0];
					if (content && content.type === 'output_text') {
						this.output.set({});
					}
				}
			},
			onItemUpdated: (item) => {
				if (item.type === 'message') {
					const content = item.content[0];
					if (content && content.type === 'output_text') {
						if (item.done) {
							const res = this.schema.safeParse(JSON.parse(content.text));
							if (res.success) {
								this.output.set(res.data);
							} else {
								console.error('onItemUpdated Parse Error', res);
							}
						} else {
							const res = this.schemaPartial.safeParse(parsePartial(content.text));
							if (res.success) {
								this.output.set(res.data);
							} else {
								console.error('onItemUpdated Parse Error', res);
							}
						}
					}
				}
			},
			onComplete: (responseId) => {
				this.previousResponseId.set(responseId);
			}
		});

		if (callResults.length) {
			this.handleResponse(
				await fetchAi(meta.apiPath, {
					fnCallResults: callResults,
					previousResponseId: get(this.previousResponseId)
				}),
				meta
			);
		}
	};

	fetch = async (apiPath: string, prompt: string) => {
		this.error.set('');
		this.generating.set(true);
		try {
			await this.handleResponse(
				await fetchAi(apiPath, {
					prompt,
					previousResponseId: get(this.previousResponseId)
				}),
				{ apiPath }
			);
		} catch (error) {
			console.error('Error generating response:', error);
			this.error.set('Error generating response. Please try again.');
		}

		this.generating.set(false);
	};

	clearConversation = () => {
		this.output.set(null);
		this.error.set('');
		this.previousResponseId.set(null);
		this.analyzingFileId.set(null);
	};
}
