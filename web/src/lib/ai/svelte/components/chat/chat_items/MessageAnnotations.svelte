<script lang="ts">
	import type { TextAnnotation } from '$lib/ai/types';

	const props: {
		annotations: TextAnnotation[];
	} = $props();

	const annotations = $derived(props.annotations);
</script>

<div class="annotations-container">
	{#each annotations as annotation}
		<div class="annotation">
			{#if annotation.type === 'container_file_citation'}
				Container File: {annotation.file_id}
			{:else if annotation.type === 'url_citation'}
				URL: <a href={annotation.url} target="_blank" rel="noopener noreferrer">
					{annotation.url}
				</a>
			{:else if annotation.type === 'file_citation'}
				File: {annotation.file_id}
			{:else if annotation.type === 'file_path'}
				File Path: {annotation.file_id}
			{/if}
		</div>
	{/each}
</div>

<style>
	.annotations-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 4px;
	}

	.annotation {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	a {
		color: inherit;
		text-decoration: underline;
	}
</style>
