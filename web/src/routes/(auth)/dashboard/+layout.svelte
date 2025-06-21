<script lang="ts">
	import AiWindow from '$lib/components/AIWindow/AIWindow.svelte';
	import Header from '$lib/components/Header.svelte';
	import Sidebar from '$lib/components/Sidebar/Sidebar.svelte';
	import Chat from '$lib/ai/svelte/components/chat/Chat.svelte';
	import { ConversationStore } from '$lib/ai/svelte/store/conversationStore';
	import { URL_API_SIGNOUT, URL_DASHBOARD } from '$lib/url';
	import { House } from '@lucide/svelte';
	import SidebarLink from '$lib/components/Sidebar/SidebarLink.svelte';
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

	const { generating, conversation, sendMessage } = new ConversationStore({
		handleAiFunctionCall: () => console.log
	});

	const items = $derived($conversation);
	const handleSendMessage = async (message: string) => {
		await sendMessage('/api/v1/llm/handle-turn', message);
	};
</script>

<div class="flex h-screen grow">
	<div class="flex h-screen min-h-screen flex-1 flex-col bg-gray-50">
		<Header {user} {onSignOut} />
		<div class="flex grow">
			<Sidebar>
				{#snippet items(isExpanded)}
					<SidebarLink {isExpanded} href={URL_DASHBOARD} label="Dashboard" Icon={House} />
				{/snippet}
			</Sidebar>
			<main class="flex w-full flex-1">
				{@render children()}
			</main>
		</div>
	</div>
	<AiWindow>
		<Chat onSendMessage={handleSendMessage} generating={$generating} {items} />
	</AiWindow>
</div>
