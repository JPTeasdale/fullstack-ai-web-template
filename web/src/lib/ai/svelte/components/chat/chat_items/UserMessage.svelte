<script lang="ts">
    import { marked } from 'marked';
	import type { ResponseInputMessageItem } from 'openai/resources/responses/responses';

    const props: {
        message: ResponseInputMessageItem;
    } = $props();

    const message = $derived(props.message);
</script>

<div class="flex flex-row justify-end text-sm">
    <div class="rounded-lg bg-gray-100 p-2 px-4">
        <div class="content">
            {#each message.content as content}
                {#if content.type === 'input_text'}
                    {@html marked(content.text || '')}
                {:else if content.type === 'input_image'}
                    <img src={content.image_url} alt={content.detail} />
                {:else if content.type === 'input_file'}
                    <div class="rounded-lg bg-gray-100 p-2 px-4">
                        {content.filename}
                    </div>
                {/if}
            {/each}
        </div>
    </div>
</div>