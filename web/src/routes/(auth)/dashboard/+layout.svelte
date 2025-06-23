<script lang="ts">
	import AiWindow from '$lib/components/AIWindow/AIWindow.svelte';
	import Header from '$lib/components/Header/Header.svelte';
	import Sidebar from '$lib/components/Sidebar/Sidebar.svelte';
	import Chat from '$lib/ai/svelte/components/chat/Chat.svelte';
	import { AiConversationStore } from '$lib/ai/svelte/store/createAiStore';
	import { URL_API_SIGNOUT, URL_DASHBOARD, URL_ORGANIZATIONS } from '$lib/url';
	import { House } from '@lucide/svelte';
	import SidebarLink from '$lib/components/Sidebar/SidebarLink.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { parse } from 'partial-json';
	import { type TodoExampleListPartial } from '$lib/ai/schemas/todo_example_schema';
	import { formatDate } from '$lib/utils/format';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	let { children, data } = $props();
	const user = $derived(data.user);

	const onSignOut = async () => {
		const res = await fetch(URL_API_SIGNOUT, {
			method: 'POST'
		});
		if (res.ok) {
			window.location.reload();
		}
	};

	const { generating, conversation, sendMessage } = new AiConversationStore({
		handleAiFunctionCall: async () => {
			// Return a proper LocalFunctionCallResult
			return { result: 'Function call handled' };
		}
	});

	const items = $derived($conversation);
	const handleSendMessage = async (message: string) => {
		await sendMessage('/api/v1/llm/handle-turn', message);
	};
</script>

<div class="flex h-screen grow">
	<div class="max-w-screen flex h-screen min-h-screen flex-1 flex-col overflow-hidden bg-gray-50">
		<Header {user} {onSignOut}>
			{#snippet contextItems()}
				<Button
					variant="ghost"
					class="block w-full px-4 text-left"
					role="menuitem"
					tabindex={-1}
					href={URL_ORGANIZATIONS}
				>
					Switch to Organization View
				</Button>
			{/snippet}
		</Header>
		<div class="flex grow">
			<Sidebar>
				{#snippet items(isExpanded)}
					<SidebarLink {isExpanded} href={URL_DASHBOARD} label="Dashboard" Icon={House} />
				{/snippet}
			</Sidebar>
			<main class="flex w-full flex-1">
				{@render children()}
			</main>
			<AiWindow>
				<Chat onSendMessage={handleSendMessage} generating={$generating} {items}>
					{#snippet itemTextContent(content)}
						{@const parsed = parse(content.text || '') as TodoExampleListPartial}

						<div class="flex flex-col gap-3">
							{#each parsed.todos || [] as todo, index}
								<label
									for="todo-{index}"
									class="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
								>
									<Checkbox id="todo-{index}" class="mt-1" />
									<div class="flex-1 space-y-1">
										<h4 class="font-medium text-gray-900">{todo?.title || ''}</h4>
										{#if todo?.date}
											<p class="text-xs text-gray-500">
												Due: {formatDate(new Date(todo.date).toISOString())}
											</p>
										{/if}
										{#if todo?.description}
											<p class="text-sm text-gray-600">{todo.description}</p>
										{/if}
									</div>
								</label>
							{/each}
						</div>
					{/snippet}
				</Chat>
			</AiWindow>
		</div>
	</div>
</div>
