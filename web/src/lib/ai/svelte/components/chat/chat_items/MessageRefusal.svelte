<script lang="ts">
	import { marked } from 'marked';
	import type { ResponseOutputRefusal } from 'openai/resources/responses/responses';
	import ChatDot from './ChatDot.svelte';

	const props: {
		content: ResponseOutputRefusal;
	} = $props();

	const content = $derived(props.content);
</script>

<div class="bg-destructive text-destructive-foreground w-full rounded-lg p-2 px-4">
	{@html marked(content.refusal || '')}
	{#if !content.done}<ChatDot />{/if}
</div>
