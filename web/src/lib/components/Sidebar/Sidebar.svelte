<script lang="ts">
	import { ChevronLeft, House as iconHouse } from '@lucide/svelte';
	import Button from '../ui/button/button.svelte';
	import type { Snippet } from 'svelte';

	let isExpanded = $state(true);

	function toggleSidebar() {
		isExpanded = !isExpanded;
	}

	const EXPANDED_WIDTH = 'w-64';
	const COLLAPSED_WIDTH = 'w-13';

	const { items }: { items: Snippet<[boolean]> } = $props();
</script>

<!-- Placeholder div to ensure content layout -->
<div
	class={`${isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH} transition-width duration-300 ease-in-out`}
></div>

<div
	class={`transition-width fixed bottom-0 left-0 top-0 flex h-screen flex-col border-r border-gray-200 bg-white pt-20 duration-300 ease-in-out ${
		isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
	}`}
>
	<nav class="flex-1 py-4">
		<ul>
			{@render items(isExpanded)}
		</ul>
	</nav>

	<div class="flex-0 flex flex-col items-end justify-center border-t border-gray-200">
		<Button onclick={toggleSidebar} variant="ghost" class="m-2 shrink-0">
			<ChevronLeft
				class="animate-transform h-5 w-5 duration-300"
				style={`transform: ${isExpanded ? 'rotate(0deg)' : 'rotate(180deg)'};`}
			/>
		</Button>
	</div>
</div>
