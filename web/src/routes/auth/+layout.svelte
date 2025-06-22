<script lang="ts">
	import Header from '$lib/components/Header/Header.svelte';

	let { children } = $props();
</script>

<div class="flex h-screen min-h-screen w-full flex-1 flex-col">
	<Header />
	<main class="flex w-full flex-1 flex-col">
		<div class="flex h-full w-full flex-row items-center justify-center">
			<div class="flex w-md flex-col items-center justify-center gap-2">
				{@render children()}
			</div>
		</div>
	</main>
</div>
