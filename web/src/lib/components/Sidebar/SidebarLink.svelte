<script lang="ts">
	const {
		href,
		Icon,
		label,
		isExpanded
	}: { href: string; Icon: Component; label: string; isExpanded: boolean } = $props();
	import { page } from '$app/state';
	import type { Component } from 'svelte';

	function isActive(path: string): boolean {
		return page.url.pathname === path;
	}
</script>

<a
	{href}
	class="flex items-center justify-start px-4 py-2 text-nowrap whitespace-nowrap {isActive(href)
		? 'bg-gray-100 text-gray-900'
		: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
>
	<div class="inline-block h-5 w-5 min-w-5">
		<Icon class="h-5 w-5 min-w-5" />
	</div>
	<span
		class="ml-3 transition-opacity delay-100 ease-in-out whitespace-nowrap truncate"
		class:shrink={isExpanded}
		style={!isExpanded ? 'opacity: 0;' : 'opacity: 1;'}>{label}</span
	>
</a>
