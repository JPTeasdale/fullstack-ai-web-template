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
		stopResize();
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
	class="relative flex h-full"
	style:width={isCollapsed ? '0' : sidebarWidth + 'px'}
	style:min-width={isCollapsed ? '0' : sidebarWidth + 'px'}
	style:max-width={isCollapsed ? '0' : sidebarWidth + 'px'}
	class:transition-width={isCollapsed || !isResizing}
	class:duration-250={isCollapsed || !isResizing}
>
	<div
		class="top-22 fixed bottom-0 right-0 z-10"
		role="separator"
		aria-orientation="horizontal"
		tabindex="-1"
	>
		<!-- Resize / collapse handle -->
		<div
			class="d relative cursor-ew-resize rounded bg-gray-300 opacity-50 hover:animate-pulse hover:bg-blue-400 hover:opacity-100"
			style:top={isCollapsed ? '0px' : 'calc(50% - 32px - 8px)'}
			style:right={isCollapsed ? '8px' : `${sidebarWidth + 2}px`}
			class:transition-all={!isResizing}
			class:duration-200={!isResizing}
			class:h-5={isCollapsed}
			class:h-16={!isCollapsed}
			class:w-1={!isCollapsed}
			class:w-5={isCollapsed}
			class:cursor-pointer={isCollapsed}
			onmousedown={handleMouseDown}
			onmouseup={handlerMouseUp}
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
			class="top-22 fixed bottom-0 right-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
			style:width={isCollapsed ? '0' : sidebarWidth + 'px'}
			style:min-width={isCollapsed ? '0' : sidebarWidth + 'px'}
			style:max-width={isCollapsed ? '0' : sidebarWidth + 'px'}
		>
			<div class="flex h-full w-full" in:fade={{ delay: 100 }}>
				{@render children()}
			</div>
		</div>
	{/if}
</div>
