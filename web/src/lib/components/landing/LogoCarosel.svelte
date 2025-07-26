<script lang="ts">
	const {
		logos
	}: {
		logos: {
			logo: string;
			name: string;
		}[];
	} = $props();
</script>

<div class="border-border bg-muted/30 border-b py-12">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<p class="text-muted-foreground mb-8 text-center text-sm font-medium uppercase tracking-wider">
			Here are logos from completely unaffiliated companies
		</p>
		<div class="logo-carousel-wrapper overflow-hidden">
			<div class="logo-carousel flex items-center gap-16">
				{#each [...logos, ...logos] as company}
					<img
						src={company.logo}
						alt={company.name}
						class="h-8 w-auto opacity-60 grayscale transition-opacity hover:opacity-100 hover:grayscale-0"
					/>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	/* Logo carousel animation */
	.logo-carousel-wrapper {
		position: relative;
		overflow: hidden;
	}

	.logo-carousel {
		animation: logo-scroll 40s linear infinite;
		white-space: nowrap;
	}

	@keyframes logo-scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

    	/* Hover effects for logo carousel */
	.logo-carousel img {
		transition: all 0.3s ease;
	}

	.logo-carousel-wrapper:hover .logo-carousel {
		animation-play-state: paused;
	}
</style>
