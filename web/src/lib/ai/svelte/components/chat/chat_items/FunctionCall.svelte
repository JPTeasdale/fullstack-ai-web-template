<script lang="ts">
	import type { ResponseFunctionToolCall } from 'openai/resources/responses/responses';

	const props: {
		item: ResponseFunctionToolCall;
	} = $props();

	const call = $derived(props.item);
</script>

<div class="function-call-container">
	<h3>{call.name}</h3>
</div>
