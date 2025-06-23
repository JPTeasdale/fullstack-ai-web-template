<script lang="ts">
	import { marked } from 'marked';
	import type {
		ResponseInputMessageItem,
		ResponseOutputMessage
	} from 'openai/resources/responses/responses';
	import MessageAnno from './chat_items/MessageAnnotations.svelte';
	import UserMessage from './chat_items/UserMessage.svelte';

	const props: {
		message: ResponseOutputMessage | ResponseInputMessageItem;
	} = $props();

	const message = $derived(props.message);
</script>

<div class="container text-sm">
	{#if message.role === 'user'}
		<UserMessage {message} />
	{:else if message.role === 'assistant'}
		<div class="assistant-message-container">
			<div class="assistant-message-bubble prose-sm">
				<!-- Only show animation if store has been initialized -->
				{#each message.content as content}
					{#if content.type === 'output_text'}
						{@const annotations = content.annotations || []}
						{@html marked(content.text || '')}
						{#if !content.done}<span class="dot"></span>{/if}
						<MessageAnnotations {annotations} />
					{:else if content.type === 'refusal'}
						<div class="bg-destructive text-destructive-foreground w-full rounded-lg p-2 px-4">
							{@html marked(content.refusal || '')}
							{#if !content.done}<span class="dot"></span>{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.container {
		padding: 6px;
	}
	.assistant-message-container {
		display: flex;
		flex-direction: row;
	}
	.content {
		overflow-wrap: break-word;
	}

	.dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 7px;
		margin-left: 4px;
		animation: pulse 1.5s infinite ease-in-out;
	}

	@keyframes pulse {
		0% {
			opacity: 0.3;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.3;
		}
	}
</style>
