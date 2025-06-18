<script lang="ts">
	import type { ToolCall } from '$lib/ai/types';

	const props: {
		item: ToolCall;
	} = $props();

	const toolCall = $derived(props.item);

	// Formatted display name based on tool type
	const displayName = $derived(() => {
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

<div class="tool-call-container text-xs">
	<div class="tool-call-header">
		<div class="tool-info">
			<div class="tool-status">
				<div class="status-indicator" style:background-color={statusColor}></div>
			</div>
			<div class="tool-name">
				{displayName}
			</div>
		</div>
	</div>
</div>

<style>
	.tool-call-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 2px 4px;
	}

	.tool-call-header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.tool-info {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 8px;
	}

	.tool-status {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 4px;
	}

	.status-indicator {
		width: 8px;
		height: 8px;
		border-radius: 4px;
	}

	.status-text {
		font-size: 12px;
		color: #666;
		text-transform: capitalize;
	}

	.tool-args-container {
		padding: 8px 12px;
		border-radius: 8px;
		overflow-x: auto;
	}

	.tool-args {
		margin: 0;
		font-family: monospace;
		font-size: 12px;
		overflow-wrap: break-word;
		white-space: pre-wrap;
	}

	.tool-output-container {
		padding: 8px 12px;
	}

	.tool-output {
		font-size: 14px;
		white-space: pre-wrap;
		overflow-wrap: break-word;
	}
</style>
