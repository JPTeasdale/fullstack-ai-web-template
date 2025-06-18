<script lang="ts">
	import type { ResponseOutputItem } from 'openai/resources/responses/responses';
	const props: {
		item: ResponseOutputItem.ImageGenerationCall;
	} = $props();

	const item = $derived(props.item);
</script>

<div class="w-full max-w-lg">
    <div class="relative w-full aspect-square bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg overflow-hidden shadow-lg">
        <!-- Blurred background overlay for loading state -->
        {#if item.status === 'in_progress'}
            <div class="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/10 blur-lg opacity-70"></div>
        {/if}
        
        <!-- Content layer -->
        <div class="relative w-full h-full flex items-center justify-center">
            {#if item.status === 'in_progress'}
                <!-- Loading spinner -->
                <div class="w-10 h-10 border-4 border-white/30 border-t-white/90 rounded-full animate-spin"></div>
            {:else if item.status === 'completed'}
                <!-- Generated image -->
                <img 
                    src={item.result} 
                    alt={item.id} 
                    class="w-full h-full object-cover"
                />
            {:else if item.status === 'failed'}
                <!-- Error state -->
                <div class="flex flex-col items-center justify-center text-white/80 bg-red-500/20 w-full h-full">
                    <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <p class="text-sm font-medium">Image generation failed</p>
                </div>
            {/if}
        </div>
    </div>
</div>