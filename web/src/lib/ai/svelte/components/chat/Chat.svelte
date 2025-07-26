<!-- 
  BaseChat.svelte - SvelteKit 5 conversion of the BaseChat.tsx React component
  Uses runes instead of React hooks
-->

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { browser } from '$app/environment';
	import { fade, slide } from 'svelte/transition';

	import ToolCall from './chat_items/ToolCall.svelte';
	import Reasoning from './chat_items/Reasoning.svelte';

	import type { ConversationItem } from '$lib/ai/types';
	import { textautosize } from '$lib/utils/textautosize';
	import { ArrowDown, ArrowUp } from '@lucide/svelte';
	import ImageGeneration from './chat_items/ImageGeneration.svelte';
	import FunctionCall from './chat_items/FunctionCall.svelte';
	import UserMessage from './chat_items/UserMessage.svelte';
	import MessageContent from './chat_items/MessageContent.svelte';
	import MessageRefusal from './chat_items/MessageRefusal.svelte';
	import type { ResponseOutputText } from 'openai/resources/responses/responses';
	import Button from '$lib/components/ui/button/Button.svelte';
	// Props using SvelteKit 5 runes
	const props: {
		items?: ConversationItem[];
		error?: string;
		onSendMessage?: (message: string) => void;
		generating?: boolean;
		placeholder?: string;
		slotAboveInput?: Snippet<[]>;
		renderFormattedOutput?: Snippet<[ResponseOutputText]>;
	} = $props();

	// Create state from props with defaults
	let items = $derived(props.items || []);
	let lastItem = $derived(items.length > 0 ? items[items.length - 1] : null);
	let onSendMessage = $derived(props.onSendMessage || ((message: string) => {}));
	let generating = $derived(props.generating || false);

	// Using runes for state
	let inputMessageText = $state('');
	let isAtBottom = $state(true);

	// Element references using runes
	let messagesWrapperRef: HTMLDivElement | null = $state(null);
	let messageListRef: HTMLDivElement | null = $state(null);

	let inputContainerRef: HTMLDivElement | null = $state(null);
	let inputRef: HTMLTextAreaElement | null = $state(null);

	let scrollToBottomOpacity = $state(0);

	// Handle scroll-to-bottom button opacity
	$effect(() => {
		scrollToBottomOpacity = isAtBottom ? 0 : 1;
	});

	$effect(() => {
		if (lastItem && lastItem.type === 'message' && lastItem.role === 'user') {
			const lastUserMessageElement = document.getElementById(lastItem.id);
			messageListRef?.style.setProperty(
				'min-height',
				`calc(${(lastUserMessageElement?.offsetTop ?? 0) - 8}px + 100%)`
			);

			messagesWrapperRef?.scrollTo({
				top: messageListRef?.scrollHeight,
				behavior: 'smooth'
			});
		}
	});

	// Handle keyboard events
	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleKeyDown);
			return () => {
				window.removeEventListener('keydown', handleKeyDown);
			};
		}
	});

	const handleScroll = (event: Event): void => {
		const target = event.target as HTMLDivElement;
		const { scrollTop, scrollHeight, clientHeight } = target;

		// Check if scrolled to bottom (with small threshold for rounding errors)
		const isScrolledToBottom =
			scrollTop >= 0 && Math.abs(scrollTop + clientHeight - scrollHeight) < 20;

		isAtBottom = isScrolledToBottom;
	};

	const sendMessage = (): void => {
		if (inputMessageText.trim()) {
			onSendMessage(inputMessageText);
			inputMessageText = '';
		}
	};

	const handleKeyDown = (event: KeyboardEvent): void => {
		if (event.key === 'Enter' && !event.shiftKey) {
			if (document.activeElement === inputRef) {
				event.preventDefault();
				sendMessage();
			}
		}
	};

	const scrollToBottom = (): void => {
		if (messagesWrapperRef && messageListRef) {
			messagesWrapperRef.scrollTo({
				top: messagesWrapperRef.scrollHeight,
				behavior: 'smooth'
			});
			isAtBottom = true;
		}
	};
</script>

<div class="flex h-full max-h-full min-h-full w-full flex-col">
	<!-- Scrollable content area -->
	<div
		bind:this={messagesWrapperRef}
		class="scroll-view flex w-full justify-center"
		onscroll={handleScroll}
	>
		<div bind:this={messageListRef} class="flex h-full w-full max-w-xl flex-col gap-2">
			{#each items as item}
				<div class="w-full" id={item.id}>
					{#if item.type === 'function_call'}
						<FunctionCall {item} />
					{:else if item.type === 'reasoning'}
						<Reasoning {item} />
					{:else if item.type === 'message'}
						{#if item.role === 'user'}
							<UserMessage message={item} />
						{:else}
							{#each item.content as content}
								{#if content.type === 'output_text'}
									{#if content.formattedType && props.renderFormattedOutput}
										{@render props.renderFormattedOutput(content)}
									{:else}
										<MessageContent {content} />
									{/if}
								{:else if content.type === 'refusal'}
									<MessageRefusal {content} />
								{/if}
							{/each}
						{/if}
					{:else if item.type === 'image_generation_call'}
						<ImageGeneration {item} />
					{:else if item.type === 'web_search_call' || item.type === 'file_search_call'}
						<ToolCall {item} />
					{:else if item.type === 'mcp_approval_request'}
						{console.error('UNIMPLEMENTED: MCP Approval Request', { item })}
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Scroll to bottom button -->
	{#if scrollToBottomOpacity > 0}
		<div
			class="scroll-to-bottom-button"
			style:opacity={scrollToBottomOpacity}
			transition:fade={{ duration: 200 }}
		>
			<button
				onclick={scrollToBottom}
				class="scroll-to-bottom-touchable bg-secondary text-secondary-foreground"
			>
				<ArrowDown size={12} />
			</button>
		</div>
	{/if}

	<div class="flex w-full flex-col items-center">
		<div class="flex w-full max-w-xl flex-col justify-center">
			<div class="relative w-full">
				{#if props.error}
					<div class="absolute bottom-0 left-0 right-0 p-4" transition:slide={{ duration: 200 }}>
						<div
							class="rounded-sm border border-red-500 bg-red-100 p-2 text-center text-xs text-red-500"
						>
							{props.error}
						</div>
					</div>
				{/if}
				{@render props.slotAboveInput?.()}
			</div>

			<!-- Input area -->
			<div class="input-container w-full bg-white shadow-lg" bind:this={inputContainerRef}>
				<div class="input-wrapper w-full">
					<textarea
						bind:this={inputRef}
						bind:value={inputMessageText}
						class="input-textarea text-foreground"
						placeholder={props.placeholder ? props.placeholder : 'Ask me anything...'}
						rows={2}
						use:textautosize
					></textarea>
					<Button
						class="rounded-full"
						disabled={!inputMessageText.trim()}
						onclick={sendMessage}
						data-testid="send-button"
						size="sm"
						loading={generating}
					>
						<ArrowUp size={10} />
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.scroll-view {
		flex: 1;
		overflow-y: auto;
		padding: 10px;
		padding-right: 15px;

		/* Custom scrollbar styling */
		scrollbar-width: thin;
		scrollbar-color: #e1e1e1 transparent;

		/* Webkit scrollbar styling for better browser support */
		&::-webkit-scrollbar {
			width: 2px;
		}

		&::-webkit-scrollbar-track {
			background: transparent;
		}

		&::-webkit-scrollbar-thumb {
			background-color: #d1d5db;
			border-radius: 1px;
		}

		&::-webkit-scrollbar-thumb:hover {
			background-color: #9ca3af;
		}
	}

	.messages-container {
		flex: 1;
		padding-top: 4px;
	}
	.input-container {
		flex: 0;
		padding: 12px;
		border-top-width: 1px;
		border-top-style: solid;
		border-top-color: #e0e0e0;
		border-top-left-radius: 5px;
		border-top-right-radius: 5px;
		box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.25);
	}

	.input-wrapper {
		display: flex;
		align-items: flex-end;
		padding-left: 6px;
		border-radius: 20px;
		border-width: 0;
	}

	.input-textarea {
		flex: 1;
		padding: 8px 12px;
		font-size: 14px;
		max-height: 45vh;
		border-color: transparent;
		border-width: 0;
		outline: none;
		resize: none;
	}

	.input-textarea::placeholder {
		color: var(--placeholder-color);
	}

	.send-button {
		width: 32px;
		height: 32px;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 16px;
		border: none;
		cursor: pointer;
	}
	.scroll-to-bottom-button {
		position: absolute;
		bottom: 80px;
		left: 50%;
		right: 50%;
		transform: translateX(-50%);
		z-index: 100;
	}

	.scroll-to-bottom-touchable {
		width: 30px;
		height: 30px;
		border-radius: 15px;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 2px 3.84px rgba(0, 0, 0, 0.25);
		border: none;
		cursor: pointer;
	}
</style>
