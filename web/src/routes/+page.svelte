<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	let mounted = false;

	// Get current day of the week and random color
	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const colors = ['Red', 'Blue', 'Green', 'Purple', 'Orange', 'Pink', 'Yellow', 'Teal', 'Coral', 'Indigo'];
	
	const now = new Date();
	const currentDay = days[now.getDay()];
	
	// Use day of year to get a stable color for each day
	const start = new Date(now.getFullYear(), 0, 0);
	const diff = now.getTime() - start.getTime();
	const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
	const randomColor = colors[dayOfYear % colors.length];

	// Countdown timer
	let countdown = '00:00:00';
	let countdownInterval: number;

	function updateCountdown() {
		const now = new Date();
		const midnight = new Date();
		midnight.setHours(24, 0, 0, 0);
		
		const diff = midnight.getTime() - now.getTime();
		
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);
		
		countdown = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	onMount(() => {
		mounted = true;
		updateCountdown();
		countdownInterval = setInterval(updateCountdown, 1000);
		
		return () => {
			clearInterval(countdownInterval);
		};
	});

	// Ticker tape content
	const tickerItems = [
		'🚀 Over 1+ developers using our template',
		'⚡ Deploy to production in under 10 minutes',
		'💸 100% cheaper than other templates',
		'🏢 Multi-tenant Database Architecture',
		'🤖 Full-stack LLM integration with OpenAI',
		'🔒 Enterprise-grade security built-in',
		'🌍 Global edge deployment',
		'🎯 Used by startups',
		'📈 Scale from 0 to 1M users seamlessly',
		'🛡️ SOC2 compliant infrastructure',
		'🎁 100% free template',
	];

	// Company logos for carousel
	const companyLogos = [
		{ name: 'Vercel', logo: 'https://cdn.worldvectorlogo.com/logos/vercel.svg' },
		{ name: 'Stripe', logo: 'https://cdn.worldvectorlogo.com/logos/stripe-4.svg' },
		{ name: 'OpenAI', logo: 'https://cdn.worldvectorlogo.com/logos/openai-2.svg' },
		{ name: 'Supabase', logo: 'https://cdn.worldvectorlogo.com/logos/supabase-logo-icon.svg' },
		{ name: 'Cloudflare', logo: 'https://cdn.worldvectorlogo.com/logos/cloudflare.svg' },
		{ name: 'GitHub', logo: 'https://cdn.worldvectorlogo.com/logos/github-icon-1.svg' },
		{ name: 'PostHog', logo: 'https://posthog.com/brand/posthog-logo.svg' },
		{ name: 'Tailwind', logo: 'https://cdn.worldvectorlogo.com/logos/tailwind-css-2.svg' }
	];

	// Stats for credibility
	const stats = [
		{ value: '0', label: 'Stars on GitHub' },
		{ value: '1', label: 'Active Developer' },
		{ value: '<50ms', label: 'Global Latency' },
		{ value: '$0,000M+', label: 'Revenue Generated' }
	];
</script>

<svelte:head>
	<title>Fullstack Web Template - Enterprise Production-Ready SvelteKit Platform</title>
	<meta
		name="description"
		content="The #1 enterprise-grade fullstack web template trusted by 10,000+ developers. Built with SvelteKit, Supabase, and Cloudflare. Deploy production-ready applications in minutes."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="bg-background min-h-screen">
	<!-- Ticker Tape -->
	<div class="bg-primary/10 border-b border-primary/20 overflow-hidden">
		<div class="ticker-wrapper">
			<div class="ticker-content">
				{#each [...tickerItems, ...tickerItems] as item}
					<span class="ticker-item text-primary font-medium text-sm px-8">{item}</span>
				{/each}
			</div>
		</div>
	</div>

	<!-- Announcement Bar -->
	<div class="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20 backdrop-blur-sm">
		<div class="px-4 py-2.5">
			<div class="flex items-center justify-center gap-2 sm:gap-4">
				<span class="inline-flex items-center gap-1.5 animate-pulse">
					<span class="text-lg">🎉</span>
					<span class="text-sm font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
						{randomColor} {currentDay} Special
					</span>
				</span>
				
				<span class="hidden sm:inline text-muted-foreground/50">•</span>
				
				<span class="text-sm text-foreground font-medium">
					100% off this free template
				</span>
				
				<span class="hidden sm:inline text-muted-foreground/50">•</span>
				
				<div class="inline-flex items-center gap-1.5 bg-background/50 backdrop-blur-sm rounded-full px-2.5 py-1 border border-border/50">
					<svg class="w-3.5 h-3.5 text-primary animate-pulse" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4l3 3a1 1 0 001.414-1.414L11 9.414V6z" clip-rule="evenodd" />
					</svg>
					<span class="text-xs font-mono font-semibold text-primary tabular-nums">
						{countdown}
					</span>
				</div>
				
				<a 
					href="https://github.com/jpteasdale/fullstack-ai-web-template" 
					class="inline-flex items-center gap-1 bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-semibold hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
				>
					<span>Claim Now</span>
					<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width={3} d="M9 5l7 7-7 7" />
					</svg>
				</a>
			</div>
		</div>
	</div>

	<!-- Hero Section -->
	<div class="border-border relative overflow-hidden border-b">
		<div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"></div>
		<div class="bg-card/50 backdrop-blur-sm relative">
			<div class="px-4 py-20 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-5xl text-center">
					<!-- Trust badges -->
					<div class="flex justify-center gap-4 mb-8">
						<span class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded-full px-3 py-1 border border-border">
							<svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							Grass Fed and Finished
						</span>
						<span class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded-full px-3 py-1 border border-border">
							<svg class="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
							Product Stunt
						</span>
						<span class="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded-full px-3 py-1 border border-border">
							<svg class="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							My Combinator
						</span>
					</div>

					<h1 class="text-foreground text-5xl font-bold tracking-tight sm:text-7xl lg:text-8xl {mounted ? 'animate-fade-in' : 'opacity-0'}">
						<span class="block">Ship Enterprise Apps</span>
						<span class="text-primary block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
							10x Faster
						</span>
					</h1>
					<p class="text-muted-foreground mx-auto mt-8 max-w-3xl text-xl sm:text-2xl leading-relaxed {mounted ? 'animate-fade-in-delay' : 'opacity-0'}">
						The most comprehensive production-ready fullstack template. Trusted by <span class="text-foreground font-semibold">1+ developers</span> and no <span class="text-foreground font-semibold">Fortune 500 companies</span>.
					</p>
					<div class="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center {mounted ? 'animate-fade-in-delay-2' : 'opacity-0'}">
						<Button size="xl" href="https://github.com/jpteasdale/fullstack-ai-web-template" class="group">
							<svg class="mr-2 h-5 w-5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
									clip-rule="evenodd"
								/>
							</svg>
							Start Building Now
						</Button>
						<Button href="#demo" size="xl" variant="outline" class="group">
							See Live Demo
							<svg class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
							</svg>
						</Button>
					</div>

					<!-- Quick stats -->
					<div class="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4 {mounted ? 'animate-fade-in-delay-3' : 'opacity-0'}">
						{#each stats as stat}
							<div>
								<div class="text-3xl font-bold text-primary">{stat.value}</div>
								<div class="text-sm text-muted-foreground">{stat.label}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Logo Carousel Section -->
	<div class="border-b border-border bg-muted/30 py-12">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<p class="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
				Here are logos from completely unaffiliated companies
			</p>
			<div class="logo-carousel-wrapper overflow-hidden">
				<div class="logo-carousel flex items-center gap-16">
					{#each [...companyLogos, ...companyLogos] as company}
						<img
							src={company.logo}
							alt={company.name}
							class="h-8 w-auto opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
						/>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Features Grid -->
	<div id="features" class="bg-muted/50 px-4 py-24 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="text-center">
				<span class="text-primary font-semibold text-sm uppercase tracking-wider">Complete Platform</span>
				<h2 class="text-foreground text-4xl font-bold sm:text-5xl mt-2">
					Everything You Need to Ship Enterprise Apps
				</h2>
				<p class="text-muted-foreground mt-6 text-xl max-w-3xl mx-auto">
					Built by a developer who has shipped to millions of users.
				</p>
			</div>

			<div class="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				<!-- Frontend -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg flex flex-col"
				>
					<div class="flex items-center mb-4">
						<div class="bg-chart-1/20 border-chart-1/30 rounded-lg border p-2">
							<svg class="text-chart-1 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Lightning-Fast Frontend</h3>
					</div>
					<p class="text-muted-foreground mb-4 flex-grow">
						Powered by SvelteKit 5 with TypeScript, Tailwind CSS 4, and shadcn/ui. 
					</p>
					<div class="flex flex-wrap gap-2 mt-auto">
						<span
							class="bg-chart-1/10 border-chart-1/20 text-chart-1 rounded-full border px-3 py-1 text-xs font-medium"
							>SvelteKit 5</span
						>
						<span
							class="bg-chart-2/10 border-chart-2/20 text-chart-2 rounded-full border px-3 py-1 text-xs font-medium"
							>TypeScript</span
						>
						<span
							class="bg-chart-3/10 border-chart-3/20 text-chart-3 rounded-full border px-3 py-1 text-xs font-medium"
							>Tailwind CSS</span
						>
						<span
							class="bg-chart-4/10 border-chart-4/20 text-chart-4 rounded-full border px-3 py-1 text-xs font-medium"
							>Shadcn/ui</span
						>
					</div>
				</div>

				<!-- Authentication & Database -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg flex flex-col"
				>
					<div class="flex items-center mb-4">
						<div class="bg-primary/20 border-primary/30 rounded-lg border p-2">
							<svg class="text-primary h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Authentication & Database</h3>
					</div>
					<p class="text-muted-foreground mb-4 flex-grow">
						Supabase auth with PostgreSQL, custom email templates, and secure user management.
					</p>
					<div class="flex flex-wrap gap-2 mt-auto">
						<span
							class="bg-chart-5/10 border-chart-5/20 text-chart-5 rounded-full border px-3 py-1 text-xs font-medium"
							>Supabase</span
						>
						<span
							class="bg-chart-1/10 border-chart-1/20 text-chart-1 rounded-full border px-3 py-1 text-xs font-medium"
							>PostgreSQL</span
						>
						<span
							class="bg-chart-3/10 border-chart-3/20 text-chart-3 rounded-full border px-3 py-1 text-xs font-medium"
							>Email Templates</span
						>
					</div>
				</div>

				<!-- Scalable Infrastructure -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg flex flex-col"
				>
					<div class="flex items-center mb-4">
						<div class="bg-chart-2/20 border-chart-2/30 rounded-lg border p-2">
							<svg class="text-chart-2 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Scalable Infrastructure</h3>
					</div>
					<p class="text-muted-foreground mb-4 flex-grow">
						Hosted with Cloudflare Workers and Supabase; free to start and cheap to scale.
					</p>
					<div class="flex flex-wrap gap-2 mt-auto">
						<span
							class="bg-chart-2/10 border-chart-2/20 text-chart-2 rounded-full border px-3 py-1 text-xs font-medium"
							>Cloudflare</span
						>
						<span
							class="bg-chart-4/10 border-chart-4/20 text-chart-4 rounded-full border px-3 py-1 text-xs font-medium"
							>Supabase</span
						>
						<span
							class="bg-chart-5/10 border-chart-5/20 text-chart-5 rounded-full border px-3 py-1 text-xs font-medium"
							>Edge Computing</span
						>
					</div>
				</div>

				<!-- Security -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg flex flex-col"
				>
					<div class="flex items-center mb-4">
						<div class="bg-chart-3/20 border-chart-3/30 rounded-lg border p-2">
							<svg class="text-chart-3 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Advanced Security</h3>
					</div>
					<p class="text-muted-foreground mb-4 flex-grow">
						Postgres RLS, rate limiting, IP blocking, and secure secret management.
					</p>
					<div class="flex flex-wrap gap-2 mt-auto">
						<span
							class="bg-chart-1/10 border-chart-1/20 text-chart-1 rounded-full border px-3 py-1 text-xs font-medium"
							>Rate Limiting</span
						>
						<span
							class="bg-chart-3/10 border-chart-3/20 text-chart-3 rounded-full border px-3 py-1 text-xs font-medium"
							>IP Blocking</span
						>
						<span
							class="bg-chart-5/10 border-chart-5/20 text-chart-5 rounded-full border px-3 py-1 text-xs font-medium"
							>Secret Storage</span
						>
					</div>
				</div>

				<!-- Payments -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg flex flex-col"
				>
					<div class="flex items-center mb-4">
						<div class="bg-chart-5/20 border-chart-5/30 rounded-lg border p-2">
							<svg class="text-chart-5 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8a2 2 0 012 2v2H6V8z"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Payments & Billing</h3>
					</div>
					<p class="text-muted-foreground mb-4 flex-grow">
						Stripe integration with webhooks, subscription management, and secure payment processing built-in.
					</p>
					<div class="flex flex-wrap gap-2 mt-auto">
						<span
							class="bg-chart-4/10 border-chart-4/20 text-chart-4 rounded-full border px-3 py-1 text-xs font-medium"
							>Stripe</span
						>
						<span
							class="bg-chart-2/10 border-chart-2/20 text-chart-2 rounded-full border px-3 py-1 text-xs font-medium"
							>Webhooks</span
						>
						<span
							class="bg-chart-1/10 border-chart-1/20 text-chart-1 rounded-full border px-3 py-1 text-xs font-medium"
							>Subscriptions</span
						>
					</div>
				</div>

				<!-- Analytics & Monitoring -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg"
				>
					<div class="flex items-center">
						<div class="bg-chart-4/20 border-chart-4/30 rounded-lg border p-2">
							<svg class="text-chart-4 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Analytics & Monitoring</h3>
					</div>
					<p class="text-muted-foreground mt-4">
						Fully integrated with PostHog for analytics, session replays, feature flags,
						experiments, error tracking, and surveys.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
						<span
							class="bg-chart-3/10 border-chart-3/20 text-chart-3 rounded-full border px-3 py-1 text-xs font-medium"
							>Web Analytics</span
						>
						<span
							class="bg-chart-5/10 border-chart-5/20 text-chart-5 rounded-full border px-3 py-1 text-xs font-medium"
							>Session Replays</span
						>
						<span
							class="bg-chart-1/10 border-chart-1/20 text-chart-1 rounded-full border px-3 py-1 text-xs font-medium"
							>Feature Flags</span
						>
						<span
							class="bg-chart-2/10 border-chart-2/20 text-chart-2 rounded-full border px-3 py-1 text-xs font-medium"
							>Experiments</span
						>
						<span
							class="bg-chart-4/10 border-chart-4/20 text-chart-4 rounded-full border px-3 py-1 text-xs font-medium"
							>Error Tracking</span
						>
						<span
							class="bg-primary/10 border-primary/20 text-primary rounded-full border px-3 py-1 text-xs font-medium"
							>Surveys</span
						>
					</div>
				</div>

				<!-- AI Tools -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg"
				>
					<div class="flex items-center">
						<div class="bg-primary/20 border-primary/30 rounded-lg border p-2">
							<svg class="text-primary h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M12.207 2.793a1 1 0 00-1.414 0l-1.586 1.586a1 1 0 001.414 1.414L12.207 4.207a1 1 0 000-1.414zM6.293 6.293a1 1 0 011.414 0l1.586 1.586a1 1 0 01-1.414 1.414L6.293 7.707a1 1 0 010-1.414zM2.793 12.207a1 1 0 011.414 0L6.793 13.793a1 1 0 01-1.414 1.414l-1.586-1.586a1 1 0 010-1.414zM12.207 17.207l1.586-1.586a1 1 0 111.414 1.414l-1.586 1.586a1 1 0 01-1.414-1.414zM10 7a3 3 0 100 6 3 3 0 000-6z"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">AI Tools</h3>
					</div>
					<p class="text-muted-foreground mt-4">
						Complete OpenAI integration with modern chat interface, function calling, and structured
						outputs.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
						<span
							class="bg-chart-5/10 border-chart-5/20 text-chart-5 rounded-full border px-3 py-1 text-xs font-medium"
							>OpenAI</span
						>
						<span
							class="bg-chart-2/10 border-chart-2/20 text-chart-2 rounded-full border px-3 py-1 text-xs font-medium"
							>Function Calling</span
						>
						<span
							class="bg-chart-4/10 border-chart-4/20 text-chart-4 rounded-full border px-3 py-1 text-xs font-medium"
							>Structured Output</span
						>
					</div>
				</div>

				<!-- Testing & Quality -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg"
				>
					<div class="flex items-center">
						<div class="bg-chart-1/20 border-chart-1/30 rounded-lg border p-2">
							<svg class="text-chart-1 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Testing & Quality</h3>
					</div>
					<p class="text-muted-foreground mt-4">
						Comprehensive testing suite with unit tests, integration tests, and end-to-end testing.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
						<span
							class="bg-chart-3/10 border-chart-3/20 text-chart-3 rounded-full border px-3 py-1 text-xs font-medium"
							>Vitest</span
						>
						<span
							class="bg-chart-1/10 border-chart-1/20 text-chart-1 rounded-full border px-3 py-1 text-xs font-medium"
							>Playwright</span
						>
						<span
							class="bg-primary/10 border-primary/20 text-primary rounded-full border px-3 py-1 text-xs font-medium"
							>E2E Testing</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Testimonials Section -->
	<div class="bg-gradient-to-b from-background to-muted/30 px-4 py-24 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="text-center mb-16">
				<span class="text-primary font-semibold text-sm uppercase tracking-wider">Testimonials</span>
				<h2 class="text-foreground text-4xl font-bold sm:text-5xl mt-2">
					Potentially Loved by Developers Worldwide
				</h2>
				<p class="text-muted-foreground mt-6 text-xl max-w-3xl mx-auto">
					Here are example testimonials from developers who could have shipped faster with this template
				</p>
			</div>

			<div class="grid gap-8 lg:grid-cols-3">
				<div class="bg-card border-border rounded-2xl border p-8 hover:shadow-xl transition-all">
					<div class="flex gap-1 mb-4">
						{#each Array(5) as _}
							<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						{/each}
					</div>
					<p class="text-foreground mb-6 leading-relaxed">
						"This template saved us 3 months of development time. We went from idea to production in just 2 weeks. The authentication and payment integrations work flawlessly."
					</p>
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60"></div>
						<div>
							<p class="font-semibold text-foreground">Sarah Chen</p>
							<p class="text-sm text-muted-foreground">CTO at TechStartup</p>
						</div>
					</div>
				</div>

				<div class="bg-card border-border rounded-2xl border p-8 hover:shadow-xl transition-all">
					<div class="flex gap-1 mb-4">
						{#each Array(5) as _}
							<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						{/each}
					</div>
					<p class="text-foreground mb-6 leading-relaxed">
						"The best fullstack template I've ever used. Everything just works out of the box. The AI integration is phenomenal and the deployment process is seamless."
					</p>
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 rounded-full bg-gradient-to-br from-chart-2 to-chart-2/60"></div>
						<div>
							<p class="font-semibold text-foreground">Michael Rodriguez</p>
							<p class="text-sm text-muted-foreground">Senior Developer at Scale AI</p>
						</div>
					</div>
				</div>

				<div class="bg-card border-border rounded-2xl border p-8 hover:shadow-xl transition-all">
					<div class="flex gap-1 mb-4">
						{#each Array(5) as _}
							<svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
							</svg>
						{/each}
					</div>
					<p class="text-foreground mb-6 leading-relaxed">
						"We evaluated 15 different templates and this was by far the most complete. Production-ready from day one with enterprise features we actually need."
					</p>
					<div class="flex items-center gap-4">
						<div class="w-12 h-12 rounded-full bg-gradient-to-br from-chart-3 to-chart-3/60"></div>
						<div>
							<p class="font-semibold text-foreground">Emily Watson</p>
							<p class="text-sm text-muted-foreground">Founder at FinTech Pro</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Demo Section -->
	<div id="demo" class="px-4 py-24 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-6xl">
			<div class="mb-12 flex flex-col items-center gap-4 text-center">
				<span class="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 rounded-full px-4 py-2 border border-primary/20">
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
					</span>
					Live Demo
				</span>
				<h2 class="text-foreground text-4xl font-bold sm:text-5xl">Experience the Power</h2>
				<p class="text-muted-foreground mt-4 text-xl max-w-2xl">
					This entire website is built with our template. Create an account to explore the dashboard and see all features in action.
				</p>
				<div class="mt-10 flex flex-col items-center gap-4 sm:flex-row">
					<Button size="xl" href="/auth/signup" class="group">
						Start Free Trial
						<svg class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M9 5l7 7-7 7" />
						</svg>
					</Button>
					<Button size="xl" href="/auth/signin" variant={'outline'}>Sign In</Button>
				</div>
			</div>
		</div>
	</div>

	<!-- About Me -->
	<div class="bg-muted/50 border-border border-y px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl">
			<div class="text-center">
				<h2 class="text-foreground text-3xl font-bold sm:text-4xl">About the Creator</h2>
				<p class="text-muted-foreground mt-4 text-lg">
					Why I built this template (and why you'll love it)
				</p>
			</div>

			<div class="bg-card border-border mt-12 rounded-xl border p-8 shadow-lg">
				<div class="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
					<div class="flex-shrink-0">
						<div
							class="bg-primary/20 border-primary/30 mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-full"
						>
							<img
								src="https://johnteasdale.com/_app/immutable/assets/avatar.Db7Vnf1A.jpg"
								alt="Me"
							/>
						</div>
					</div>
					<div class="flex-1 text-center lg:text-left">
						<h3 class="text-foreground text-xl font-semibold">
							Hi, I'm a Full Stack Developer & Serial Entrepreneur
						</h3>
						<p class="text-muted-foreground mt-4 text-lg leading-relaxed">
							After building dozens of web applications over the years, I got completely exhausted
							by the same repetitive setup process. Every. Single. Time.
						</p>
						<p class="text-muted-foreground mt-4 leading-relaxed">
							Setting up authentication, integrating Stripe payments, configuring analytics,
							implementing security measures, setting up deployment pipelines... All before I could
							even start building the features that mattered.
						</p>
						<p class="text-muted-foreground mt-4 leading-relaxed">
							So I built this template to solve my own problem. Now I can go from idea to deployed
							MVP in hours, not weeks. I've used this exact stack to launch multiple successful
							projects, and I'm sharing it because I believe every developer deserves to spend their
							time building features, not fighting with infrastructure.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>


	<!-- CTA Section -->
	<div class="bg-accent/50 border-border border-y px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl text-center">
			<h2 class="text-foreground text-3xl font-bold sm:text-4xl">
				Ready to Build Your Next Project?
			</h2>
			<p class="text-muted-foreground mt-4 text-lg">
				Stop wasting time on boilerplate. Start building features that matter.
			</p>
			<div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
				<a
					href="https://github.com/yourusername/fullstack-ai-web-template"
					class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-8 py-4 text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
				>
					<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
							clip-rule="evenodd"
						/>
					</svg>
					Get Started Now
				</a>
				<div class="text-muted-foreground text-sm">
					⭐ Star on GitHub • 🚀 Deploy in minutes • 💰 Save months of development
				</div>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="border-border border-t px-4 py-12 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="text-center">
				<p class="text-muted-foreground text-sm">
					Built with ❤️ using the technologies showcased above.
					<a
						href="https://github.com/yourusername/fullstack-ai-web-template"
						class="text-primary hover:text-primary/80"
					>
						Contribute on GitHub
					</a>
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom scrollbar for better mobile experience */
	:global(html) {
		scroll-behavior: smooth;
	}

	/* Ensure proper mobile responsiveness */
	@media (max-width: 640px) {
		:global(body) {
			overflow-x: hidden;
		}
	}

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

	/* Fade in animations */
	.animate-fade-in {
		animation: fadeIn 0.8s ease-out;
	}

	.animate-fade-in-delay {
		animation: fadeIn 0.8s ease-out 0.2s both;
	}

	.animate-fade-in-delay-2 {
		animation: fadeIn 0.8s ease-out 0.4s both;
	}

	.animate-fade-in-delay-3 {
		animation: fadeIn 0.8s ease-out 0.6s both;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
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
