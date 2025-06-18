<script lang="ts">
	import { onMount } from 'svelte';
	import { CircleStop } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	const { children } = $props();

	const COLLAPSE_THRESHOLD = 200;
	const DEFAULT_EXPANDED_WIDTH = 400;
	const MAX_WIDTH = 900;

	let sidebarWidth = $state(0);
	let isCollapsed = $state(true);
	let isResizing = $state(false);
	let hasResized = $state(false);
	let initialX = $state(0);
	let initialWidth = $state(0);

	function handleMouseDown(e: MouseEvent) {
		if (isCollapsed) {
			sidebarWidth = Math.max(sidebarWidth, DEFAULT_EXPANDED_WIDTH);
			isCollapsed = false;
		} else {
			isResizing = true;
			hasResized = false;
			initialX = e.clientX;
			initialWidth = sidebarWidth;
			document.body.style.cursor = 'ew-resize';
			document.body.style.userSelect = 'none';
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isResizing) return;

		const delta = initialX - e.clientX;
		sidebarWidth = Math.max(10, Math.min(MAX_WIDTH, initialWidth + delta));
		hasResized = true;
		if (sidebarWidth < COLLAPSE_THRESHOLD) {
			isCollapsed = true;
			isResizing = false;
		}
		e.preventDefault();
	}

	function handlerMouseUp() {
		if (!isCollapsed && !hasResized) {
			isCollapsed = true;
		}
	}

	function stopResize() {
		isResizing = false;
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}

	onMount(() => {
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', stopResize);
	});
</script>

<div
	class="relative flex h-screen"
	style:width={isCollapsed ? '0' : sidebarWidth + 'px'}
	style:min-width={isCollapsed ? '0' : sidebarWidth + 'px'}
	style:max-width={isCollapsed ? '0' : sidebarWidth + 'px'}
	class:transition-width={isCollapsed || !isResizing}
	class:duration-250={isCollapsed || !isResizing}
>
	<div
		class="absolute -left-0.5 bottom-0 top-0 z-10 flex cursor-ew-resize items-center"
		role="separator"
		aria-orientation="horizontal"
		tabindex="-1"
		onmousedown={handleMouseDown}
		onmouseup={handlerMouseUp}
	>
		<!-- Resize / collapse handle -->
		<div
			class="absolute rounded bg-gray-300 opacity-50 transition-all duration-200 hover:animate-pulse hover:bg-blue-400 hover:opacity-100"
			style:right={isCollapsed ? '8px' : '0'}
			style:top={isCollapsed ? '86px' : 'calc(50vh - 32px - 8px)'}
			class:h-5={isCollapsed}
			class:h-16={!isCollapsed}
			class:w-1={!isCollapsed}
			class:w-5={isCollapsed}
			class:cursor-pointer={isCollapsed}
		>
			{#if isCollapsed}
				<div in:fade={{ delay: 250 }}>
					<CircleStop class="h-5 w-5" strokeWidth={1} />
				</div>
			{/if}
		</div>
	</div>
	{#if !isCollapsed}
		<div
			in:fade={{ delay: 100 }}
			class="fixed bottom-0 right-0 top-0 overflow-hidden border-l border-gray-200 bg-white shadow-lg"
			style:width={isCollapsed ? '0' : sidebarWidth + 'px'}
			style:min-width={isCollapsed ? '0' : sidebarWidth + 'px'}
			style:max-width={isCollapsed ? '0' : sidebarWidth + 'px'}
		>
			{@render children()}
		</div>
	{/if}
</div>
