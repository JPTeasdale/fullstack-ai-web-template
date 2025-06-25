import { get, writable } from 'svelte/store';
import { errorStr } from '$lib/utils/error';
import { handleStreamEvents } from '$lib/ai/client/handle_stream_events';
import type {
	AppFunctionCallItem,
	AiToolResult,
	ConversationItem,
	AiFunctionCallDefinitions,
	LocalFunctionCallResult,
	HandleFunctionCallFunction
} from '$lib/ai/types';
import { fetchAi } from '$lib/ai/client/fetch';

interface PendingToolCall<T extends AiFunctionCallDefinitions> {
	tool: AppFunctionCallItem<T>;
	resolve: (s: string) => void;
}

type HandleResponseMeta = {
	apiPath: string;
};

type ConversationStoreOptions<T extends AiFunctionCallDefinitions> = {
	initialConversation?: ConversationItem[];
	handleAiFunctionCall: HandleFunctionCallFunction<T>;
};

export class ConversationStore<T extends AiFunctionCallDefinitions> {
	readonly conversation = writable<ConversationItem[]>([]);
	readonly generating = writable(false);
	readonly conversationError = writable('');
	readonly previousResponseId = writable<string | null>(null);
	readonly analyzingFileId = writable<string | null>(null);
	readonly pendingToolCall = writable<PendingToolCall<T> | null>(null);
	readonly handleAiFunctionCall: (
		fnCall: AppFunctionCallItem<T>
	) => Promise<LocalFunctionCallResult>;

	constructor(opts: ConversationStoreOptions<T>) {
		this.conversation.set(opts.initialConversation || []);
		this.handleAiFunctionCall = opts.handleAiFunctionCall;
	}

	private handleResponse = async (res: Response, meta: HandleResponseMeta) => {
		const callResults: AiToolResult[] = [];

		await handleStreamEvents<T>(res, {
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
				this.conversation.update((conv) => [...conv, JSON.parse(JSON.stringify(item))]);
			},
			onItemUpdated: (item) => {
				this.conversation.update((conv) =>
					conv.map((i) => (i.id === item.id ? JSON.parse(JSON.stringify(item)) : i))
				);
			},
			onComplete: (responseId) => {
				this.previousResponseId.set(responseId);
			}
		});

		if (callResults.length) {
			await this.handleResponse(
				await fetchAi(meta.apiPath, {
					fnCallResults: callResults,
					previousResponseId: get(this.previousResponseId)
				}),
				meta
			);
		}
	};

	sendMessage = async (apiPath: string, prompt: string) => {
		if (prompt.length) {
			this.conversation.update((conv) => [
				...conv,
				{
					id: crypto.randomUUID(),
					type: 'message',
					role: 'user' as const,
					content: [
						{
							type: 'input_text',
							text: prompt
						}
					]
				}
			]);
		}

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
			this.conversationError.set('Error generating response. Please try again.');
		}

		this.generating.set(false);
	};

	clearConversation = () => {
		this.conversation.set([]);
		this.conversationError.set('');
		this.previousResponseId.set(null);
		this.analyzingFileId.set(null);
	};
}
