<script lang="ts">
	import { marked } from 'marked';
	import type { ResponseOutputText } from 'openai/resources/responses/responses';
	import MessageAnnotations from './MessageAnnotations.svelte';
	import ChatDot from './ChatDot.svelte';

	const props: {
		content: ResponseOutputText;
	} = $props();

	const content = $derived(props.content);
	const annotations = $derived(content.annotations || []);
</script>

<div class="p-2 text-sm">
	<div class="flex flex-row">
		<div class="assistant-message-bubble prose-sm">
			{@html marked(content.text || '')}
			{#if !content.done}<ChatDot />{/if}
			<MessageAnnotations {annotations} />
		</div>
	</div>
</div>
