<script lang="ts">
	import type { ResponseOutputItem } from 'openai/resources/responses/responses';

	const props: {
		item: ResponseOutputItem.McpApprovalRequest;
	} = $props();

	const item = $derived(props.item);
</script>

<div class="mcp-approval-request-container">
	{item.name}
</div>
