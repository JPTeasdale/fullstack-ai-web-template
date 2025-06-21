<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';

	const { data } = $props();
	const organizations = $derived(data.organizations ?? []);
	const profile = $derived(data.profile);
</script>

<div class="p-2">Select Organization</div>

{#each organizations as organization}
	<div>{organization.name}</div>
{/each}

<Button>New Organization</Button>
