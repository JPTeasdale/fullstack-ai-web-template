<script lang="ts">
    const { items }: { items: string[] } = $props();
</script>

<div class="bg-primary/10 border-primary/20 overflow-hidden border-b">
    <div class="ticker-wrapper">
        <div class="ticker-content">
            {#each [...items, ...items] as item}
                <span class="ticker-item text-primary px-8 text-sm font-medium">{item}</span>
            {/each}
        </div>
    </div>
</div>

<style> 

	/* Ticker tape animation */
	.ticker-wrapper {
		position: relative;
		overflow: hidden;
		height: 40px;
		display: flex;
		align-items: center;
	}

	.ticker-content {
		display: flex;
		animation: ticker 30s linear infinite;
		white-space: nowrap;
	}

	@keyframes ticker {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}
</style>