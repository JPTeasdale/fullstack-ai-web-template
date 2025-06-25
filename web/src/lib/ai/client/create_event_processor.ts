import type { ResponseStreamEvent } from 'openai/resources/responses/responses.mjs';
import type {
	ServerConversationItem,
	AppFunctionCallItem,
	AiFunctionCallDefinitions
} from '../types';

function handleFunctionCallDefault<T extends AiFunctionCallDefinitions>(
	functionCall: AppFunctionCallItem<T>
) {
	console.log('Function Call', functionCall);
}

export interface EventCallbacks<T extends AiFunctionCallDefinitions> {
	onFunctionCall?(functionCall: AppFunctionCallItem<T>): Promise<void>;
	onItemAdded?(message: ServerConversationItem): void;
	onItemUpdated?(message: ServerConversationItem): void;
	onComplete?(responseId: string): void;
	onError?(error: Error): void;
}

// Create a processor that maintains state across multiple calls
export function createEventProcessor<T extends AiFunctionCallDefinitions>(
	opts?: EventCallbacks<T>
) {
	// Track in-progress events by their ID
	const inProgressEvents = new Map<string, ServerConversationItem>();

	const handleFunctionCall = opts?.onFunctionCall || handleFunctionCallDefault<T>;
	const onItemAdded = opts?.onItemAdded || (() => {});
	const onItemUpdated = opts?.onItemUpdated || (() => {});
	const onComplete = opts?.onComplete || (() => {});

	function getMessage(id: string) {
		const event = inProgressEvents.get(id);
		if (!event || event.type !== 'message') {
			return null;
		}
		return event;
	}

	function getToolCall(id: string) {
		const event = inProgressEvents.get(id);
		switch (event?.type) {
			case 'web_search_call':
			case 'file_search_call':
			case 'mcp_call':
			case 'code_interpreter_call':
			case 'local_shell_call':
			case 'mcp_list_tools':
				return event;
			default:
				return null;
		}
	}

	function getReasoning(id: string) {
		const event = inProgressEvents.get(id);
		if (!event || event.type !== 'reasoning') {
			return null;
		}
		return event;
	}

	function getFunctionCall(id: string) {
		const event = inProgressEvents.get(id);
		if (!event || event.type !== 'function_call') {
			return null;
		}
		return event;
	}

	return async (event: ResponseStreamEvent) => {
		switch (event.type) {
			case 'response.created': {
				console.log('Response created', event);
				break;
			}
			case 'response.completed': {
				onComplete(event.response.id);
				inProgressEvents.clear();
				break;
			}
			case 'response.incomplete':
			case 'response.failed': {
				console.error('Response failed', event);
				onComplete(event.response.id);
				inProgressEvents.clear();
				break;
			}

			case 'response.output_item.added': {
				const { item } = event;
				if (!item.id) {
					break;
				}

				const newItem = { ...item, done: false };

				inProgressEvents.set(item.id, newItem);
				onItemAdded(newItem);
				break;
			}

			case 'response.output_item.done': {
				const { item } = event;
				if (!item.id) {
					break;
				}

				// Try to find the item in our in-progress map first
				const inProgressItem = inProgressEvents.get(item.id);
				if (!inProgressItem) {
					break;
				}
				Object.assign(inProgressItem, item, { done: true });

				onItemUpdated(inProgressItem);

				if (inProgressItem.type === 'function_call') {
					await handleFunctionCall(inProgressItem as unknown as AppFunctionCallItem<T>);
				}

				inProgressEvents.delete(item.id);
				break;
			}

			case 'response.content_part.done':
			case 'response.content_part.added': {
				const message = getMessage(event.item_id);
				if (message) {
					message.content[event.content_index] = {
						...event.part,
						done: event.type === 'response.content_part.done'
					};

					onItemUpdated(message);
				}
				break;
			}

			case 'response.refusal.delta': {
				const message = getMessage(event.item_id);
				if (message) {
					const refusalItem = message.content[event.content_index];
					if (refusalItem.type === 'refusal') {
						refusalItem.parts = [...(refusalItem.parts || []), event.delta];
						onItemUpdated(message);
					}
				}
				break;
			}

			case 'response.refusal.done': {
				const message = getMessage(event.item_id);
				if (message) {
					const refusalItem = message.content[event.content_index];
					if (refusalItem.type === 'refusal') {
						refusalItem.refusal = event.refusal;
						refusalItem.done = true;
						onItemUpdated(message);
					}
				}
				break;
			}

			case 'response.output_text.delta': {
				const message = getMessage(event.item_id);
				if (message) {
					const contentItem = message.content[event.content_index];
					if (contentItem.type === 'output_text') {
						contentItem.text += event.delta;
						contentItem.parts = [...(contentItem.parts || []), event.delta];
						onItemUpdated(message);
					}
				}
				break;
			}

			case 'response.output_text.done': {
				const message = getMessage(event.item_id);
				if (message) {
					const contentItem = message.content[event.content_index];
					if (contentItem.type === 'output_text') {
						contentItem.done = true;
						contentItem.text = event.text;
						onItemUpdated(message);
					}
				}
				break;
			}
			case 'response.output_text_annotation.added': {
				const message = getMessage(event.item_id);
				if (message && message.type === 'message') {
					let contentItem = message.content[event.content_index];
					if (!contentItem) {
						contentItem = {
							type: 'output_text',
							text: '',
							annotations: []
						};
					}
					if (contentItem.type === 'output_text') {
						// @ts-expect-error - Pretty sure this is a bug in the OpenAI types
						contentItem.annotations[event.annotation_index] = event.annotation;
					}

					onItemUpdated(message);
				}
				break;
			}

			case 'response.function_call_arguments.done':
			case 'response.function_call_arguments.delta': {
				const functionCall = getFunctionCall(event.item_id);
				if (functionCall) {
					if (event.type === 'response.function_call_arguments.delta') {
						functionCall.arguments += event.delta;
					} else if (event.type === 'response.function_call_arguments.done') {
						functionCall.arguments = event.arguments;
						functionCall.parsedArguments = JSON.parse(event.arguments);
						functionCall.done = true;
					}
					onItemUpdated(functionCall);
				}
				break;
			}
			case 'response.mcp_call.completed':
			case 'response.mcp_list_tools.completed':
				break;
			case 'response.web_search_call.completed':
			case 'response.file_search_call.completed': {
				const message = getToolCall(event.item_id);
				if (message) {
					if (message.type === 'file_search_call') {
						message.status = 'completed';
					} else if (message.type === 'web_search_call') {
						message.status = 'completed';
					}
					onItemUpdated(message);
					inProgressEvents.delete(event.item_id);
				}

				break;
			}

			case 'response.reasoning_summary_part.added':
			case 'response.reasoning_summary_part.done': {
				const reasoning = getReasoning(event.item_id);
				if (reasoning) {
					if (!reasoning.summary) {
						reasoning.summary = [];
					}

					reasoning.summary[event.summary_index] = {
						...event.part,
						// @ts-expect-error - Another bug in the OpenAI types
						done: event.type === 'response.reasoning_summary_part.done'
					};

					onItemUpdated(reasoning);
				}
				break;
			}
			case 'response.reasoning_summary_text.delta':
			case 'response.reasoning_summary_text.done': {
				const reasoning = getReasoning(event.item_id);
				if (reasoning) {
					if (event.type === 'response.reasoning_summary_text.delta') {
						reasoning.summary[event.summary_index].text += event.delta;
					} else {
						reasoning.summary[event.summary_index].text = event.text;
					}
				}
				break;
			}

			case 'response.reasoning.done':
			case 'response.reasoning.delta': {
				// Ignoring these. These are the ultra detailed reasoninglogs.
				break;
			}
		}
	};
}
