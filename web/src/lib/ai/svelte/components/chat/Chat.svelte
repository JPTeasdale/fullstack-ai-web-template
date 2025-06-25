<!-- 
  BaseChat.svelte - SvelteKit 5 conversion of the BaseChat.tsx React component
  Uses runes instead of React hooks
-->

<script lang="ts">
	import { onMount, onDestroy, type Snippet } from 'svelte';
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
	let onSendMessage = $derived(props.onSendMessage || ((message: string) => {}));
	let generating = $derived(props.generating || false);

	// Using runes for state
	let inputMessageText = $state('');
	let isAtBottom = $state(true);

	// Element references using runes
	let inputContainerRef: HTMLDivElement | null = $state(null);
	let scrollViewRef: HTMLDivElement | null = $state(null);
	let inputRef: HTMLTextAreaElement | null = $state(null);
	let messagesContainerRef: HTMLDivElement | null = $state(null);
	let messageRefs: (HTMLDivElement | null)[] = $state([]);
	let scrollToBottomOpacity = $state(0);

	// Handle scroll-to-bottom button opacity
	$effect(() => {
		scrollToBottomOpacity = isAtBottom ? 0 : 1;
	});

	// Handle keyboard events
	onMount(() => {
		if (browser) {
			window.addEventListener('keydown', handleKeyDown);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('keydown', handleKeyDown);
		}
	});

	const scrollToLatestUserMessage = async (animated = true): Promise<void> => {
		// Use standard array method instead of findLastIndex for better compatibility
		let userMessageIndex = -1;
		for (const [idx, item] of items.entries()) {
			if (item.type === 'message' && item.role === 'user') {
				userMessageIndex = idx;
			}
		}
		if (userMessageIndex >= 0) {
			await scrollToMessage(userMessageIndex, animated);
		}
	};

	const scrollToMessage = async (messageIndex: number, animated: boolean): Promise<void> => {
		const messageView = messageRefs[messageIndex];

		if (messageIndex >= 0 && scrollViewRef && messageView) {
			const messageOffsetTop = messageView.offsetTop;
			// Scroll to the message position
			scrollViewRef.scrollTo({
				top: messageOffsetTop,
				behavior: animated ? 'smooth' : 'instant'
			});
		}
	};

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
			// Keep focus on the input
			setTimeout(() => {
				if (inputRef) inputRef.focus();
				scrollToLatestUserMessage();
			}, 100);
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
		if (scrollViewRef && messagesContainerRef) {
			scrollViewRef.scrollTo({
				top: scrollViewRef.scrollHeight,
				behavior: 'smooth'
			});
			isAtBottom = true;
		}
	};
</script>

<div class="flex h-full max-h-full min-h-full w-full flex-col">
	<!-- Scrollable content area -->
	<div
		bind:this={scrollViewRef}
		class="scroll-view flex w-full justify-center"
		onscroll={handleScroll}
	>
		<div bind:this={messagesContainerRef} class="flex h-full w-full max-w-xl flex-col gap-2">
			{#each items as item, index}
				{@const isLast = index === items.length - 1}
				<div
					class="w-full"
					style:min-height={isLast ? '100%' : undefined}
					bind:this={messageRefs[index]}
				>
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
			<div class="w-full relative">
			{#if props.error}
				<div class="absolute bottom-0 left-0 right-0 p-4" transition:slide={{ duration: 200 }}>
					<div class="text-sm border border-red-500 text-center bg-red-100 text-red-500 rounded-sm " >
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
					<button
						class="send-button bg-primary text-primary-foreground hover:bg-primary/60"
						disabled={!inputMessageText.trim()}
						onclick={sendMessage}
						data-testid="send-button"
					>
						<ArrowUp size={18} />
					</button>
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
