<script lang="ts">
	import { page } from '$app/state';

	import { URL_DASHBOARD } from '$lib/url';
	import { ChevronLeft, House } from '@lucide/svelte';
	import SidebarLink from './SidebarLink.svelte';
	import Button from '../ui/button/button.svelte';

	let isExpanded = $state(true);

	function toggleSidebar() {
		isExpanded = !isExpanded;
	}

	const EXPANDED_WIDTH = 'w-64';
	const COLLAPSED_WIDTH = 'w-13';
</script>

<!-- Placeholder div to ensure content layout -->
<div
	class={`${isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH} transition-width duration-300 ease-in-out`}
>
	<!-- This div ensures the main content doesn't flow under the sidebar -->
</div>

<!-- Fixed sidebar -->
<div
	class={`bg-white transition-width fixed bottom-0 left-0 top-0 flex h-screen flex-col border-r border-gray-200 bg-white pt-20 duration-300 ease-in-out ${
		isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
	}`}
>
	<!-- Navigation links -->
	<nav class="flex-1 py-4">
		<ul class="space-y-2">
			<li>
				<SidebarLink href={URL_DASHBOARD} label="Dashboard" {isExpanded} Icon={House} />
			</li>
		</ul>
	</nav>

	<!-- Toggle button -->
	<div class="flex-0 flex flex-col items-end justify-center border-t border-gray-200">
		<Button onclick={toggleSidebar} variant="ghost" class="m-2 shrink-0">
			<ChevronLeft
				class="animate-transform h-5 w-5 duration-300"
				style={`transform: ${isExpanded ? 'rotate(0deg)' : 'rotate(180deg)'};`}
			/>
		</Button>
	</div>
</div>
