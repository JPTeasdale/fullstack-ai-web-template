<script lang="ts">
	import type { Snippet } from 'svelte';
	import AiWindow from '../AIWindow/AIWindow.svelte';
	import Button from '../ui/button/button.svelte';
	import { LayoutDashboard, CircleStop } from '@lucide/svelte';
	import Sidebar from '../Sidebar/Sidebar.svelte';
	let {
		header,
		sideNavItems,
		chat,
		children
	}: {
		header?: Snippet;
		sideNavItems?: Snippet<[boolean]>;
		chat?: Snippet;
		children: Snippet;
	} = $props();

	let isChatOpen = $state(false);
</script>

<div class="flex h-screen grow">
	<div class="flex h-screen max-h-screen min-h-screen max-w-screen flex-1 flex-col bg-gray-50">
		{#if header}
			{@render header()}
		{/if}
		<div class="flex flex-1 sm:pb-0">
			{#if sideNavItems}
				<Sidebar items={sideNavItems} />
			{/if}
			<main class="flex w-full flex-1 p-4 pb-16 sm:pb-4">
				{@render children()}
			</main>
			{#if chat}
				<div class="z-50 hidden w-full flex-0 shadow-lg sm:block">
					<AiWindow>
						{@render chat()}
					</AiWindow>
				</div>
				{#if isChatOpen}
					<div class="fixed top-18 right-0 bottom-0 left-0 w-screen bg-white pb-10 sm:hidden">
						{@render chat()}
					</div>
				{/if}
			{/if}
		</div>
		{#if chat}
			<div
				class="bg-card fixed right-0 bottom-0 left-0 z-50 flex h-10 w-full flex-0 shadow-lg sm:hidden"
			>
				<Button variant="ghost" class="flex-1 rounded-none" onclick={() => (isChatOpen = false)}>
					<LayoutDashboard class="h-4 w-4" />
				</Button>
				<Button variant="ghost" class="flex-1 rounded-none" onclick={() => (isChatOpen = true)}>
					<CircleStop class="h-4 w-4" />
				</Button>
			</div>
		{/if}
	</div>
</div>
