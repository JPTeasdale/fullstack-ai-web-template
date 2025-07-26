<script lang="ts">
	import { isOnScreen } from '$lib/utils/onscreen';
	import { onMount } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		reverse?: boolean;
		children?: any;
		imageSlot?: any;
	}

	let { title, description, reverse = false, children, imageSlot }: Props = $props();

	let sectionElement: HTMLElement;
	let isVisible = $state(false);

	onMount(() =>
		isOnScreen(sectionElement, (vis) => {
			isVisible = vis;
		})
	);
</script>

<section bind:this={sectionElement} class="relative py-16 lg:py-24">
	{#if reverse}
		<div class="bg-muted/30 absolute inset-0"></div>
	{/if}

	<div class="relative mx-auto max-w-7xl px-6 lg:px-8">
		<!-- Mobile: Stack vertically with title on top -->
		<!-- Desktop: Side by side -->
		<div
			class={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 lg:gap-16`}
		>
			<!-- Content Column -->
			<div
				class={`flex-1 transition-all duration-700 ease-out ${
					isVisible
						? 'translate-x-0 opacity-100'
						: reverse
							? 'translate-x-8 opacity-0'
							: '-translate-x-8 opacity-0'
				}`}
			>
				<h2 class="font-inter text-foreground mb-6 text-3xl font-bold leading-[1.2] lg:text-4xl">
					{title}
				</h2>
				{#if description}
					<p class="font-inter text-muted-foreground mb-8 text-lg leading-[1.6]">
						{description}
					</p>
				{/if}
				{#if children}
					<div class="font-inter text-muted-foreground space-y-6 text-lg leading-[1.6]">
						{@render children()}
					</div>
				{/if}
			</div>

			<!-- Image/Animation Column -->
			<div
				class={`flex-1 transition-all delay-200 duration-700 ease-out ${
					isVisible
						? 'translate-x-0 opacity-100'
						: reverse
							? '-translate-x-8 opacity-0'
							: 'translate-x-8 opacity-0'
				}`}
			>
				{#if imageSlot}
					{@render imageSlot()}
				{:else}
					<!-- Default placeholder visualization -->
					<div
						class="bg-card border-border flex min-h-[400px] items-center justify-center rounded-2xl border p-8 shadow-lg"
					>
						<div class="bg-primary/10 h-32 w-32 animate-pulse rounded-full"></div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>
