<script lang="ts">
	import '../app.css';

	import posthog from 'posthog-js';
	import { onMount } from 'svelte';
	import { setAuthStore } from '$lib/stores/auth';

	let { data, children } = $props();
	setAuthStore(data.session);

	onMount(() => {
		if (data.user) {
			posthog.identify(data.user.id, {
				email: data.user.email
			});
		}
	});
</script>

{@render children()}
