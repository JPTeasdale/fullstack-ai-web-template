<script lang="ts">
	import type { ResponseReasoningItem } from 'openai/resources/responses/responses';
	import { fade } from 'svelte/transition';

	const props: {
		item: ResponseReasoningItem;
	} = $props();

	const item = $derived(props.item);
</script>

{#if item.status === 'in_progress'}
	<div out:fade={{ duration: 100 }}>Reasoning...</div>
	<div class="reasoning-container">
		<div class="reasoning-content">
			{#each item.summary as summary}
				<div class="reasoning-step">
					<div class="reasoning-step-content">
						{summary.text}
					</div>
				</div>
			{/each}
		</div>
	</div>
{:else if item.status === 'completed'}
	<div out:fade={{ duration: 100 }}>Reasoning completed</div>
{:else if item.status === 'incomplete'}
	<div out:fade={{ duration: 100 }}>Reasoning failed</div>
{/if}
