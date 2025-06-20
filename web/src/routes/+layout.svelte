<script lang="ts">
	import '../app.css';

	import posthog from 'posthog-js';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	onMount(() => {
		if (data.user) {
			posthog.identify(data.user.id, {
				email: data.user.email
			});
		}
	});
</script>

{@render children()}
