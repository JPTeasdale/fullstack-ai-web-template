<script lang="ts">
	import type { ToolCall } from '$lib/ai/types';

	const props: {
		item: ToolCall;
	} = $props();

	const toolCall = $derived(props.item);

	// Formatted display name based on tool type
	const displayName = $derived.by(() => {
		switch (toolCall.type) {
			case 'web_search_call':
				return 'Web Search';
			case 'file_search_call':
				return 'File Search';
			default:
				return 'Tool Call';
		}
	});

	// Status indicator color mapping
	function getStatusColor(status: string): string {
		switch (status) {
			case 'completed':
				return '#4CAF50'; // green
			case 'in_progress':
				return '#FFC107'; // yellow
			case 'searching':
				return '#2196F3'; // blue
			case 'failed':
				return '#F44336'; // red
			case 'incomplete':
				return '#9E9E9E'; // gray
			default:
				return '#9E9E9E'; // gray
		}
	}

	const statusColor = $derived(getStatusColor(toolCall.status || ''));
</script>

<div class="flex flex-col gap-2 px-1 py-0.5 text-xs">
	<div class="flex flex-row items-center justify-between">
		<div class="flex flex-row items-center gap-2">
			<div class="flex flex-row items-center gap-1">
				<div class="h-2 w-2 rounded" style:background-color={statusColor}></div>
			</div>
			<div class="tool-name">
				{displayName}
			</div>
		</div>
	</div>
</div>
