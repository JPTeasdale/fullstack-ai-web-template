<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';

	let mounted = false;
	onMount(() => {
		mounted = true;
	});
</script>

<svelte:head>
	<title>Fullstack Web Template - Production-Ready SvelteKit Starter</title>
	<meta
		name="description"
		content="A comprehensive, production-ready fullstack web template with SvelteKit, Supabase, Cloudflare, and modern DevOps practices. Deploy in minutes, not months."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</svelte:head>

<div class="bg-background min-h-screen">
	<!-- Hero Section -->
	<div class="border-border relative overflow-hidden border-b">
		<div class="bg-card">
			<div class="px-4 py-16 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-4xl text-center">
					<h1 class="text-foreground text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
						<span class="block">Free Production-Ready</span>
						<span class="text-primary block"> Ai Web Template </span>
					</h1>
					<p class="text-muted-foreground mx-auto mt-6 max-w-3xl text-lg sm:text-xl">
						Start from a strong foundation. Deploy your next SaaS, web app, or startup in minutes
						with this comprehensive template featuring modern tech stack, authentication, payments,
						and deployment automation.
					</p>
					<div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
						<Button size="xl" href="https://github.com/jpteasdale/fullstack-ai-web-template">
							<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
									clip-rule="evenodd"
								/>
							</svg>
							Clone on GitHub</Button
						>
						<Button href="#demo" size="xl" variant="outline">View Demo</Button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Grid -->
	<div id="features" class="bg-muted/50 px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-7xl">
			<div class="text-center">
				<h2 class="text-foreground text-3xl font-bold sm:text-4xl">
					Everything You Need to Ship Fast
				</h2>
				<p class="text-muted-foreground mt-4 text-lg">
					A complete, production-ready stack with modern technologies and best practices
				</p>
			</div>

			<div class="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				<!-- Frontend -->
				<div
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg"
				>
					<div class="flex items-center">
						<div class="bg-chart-1/20 border-chart-1/30 rounded-lg border p-2">
							<svg class="text-chart-1 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Modern Frontend</h3>
					</div>
					<p class="text-muted-foreground mt-4">
						SvelteKit 5 with TypeScript, Tailwind CSS 4, and shadcn/ui components for a
						blazing-fast, type-safe frontend.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
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
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg"
				>
					<div class="flex items-center">
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
					<p class="text-muted-foreground mt-4">
						Supabase auth with PostgreSQL, custom email templates, and secure user management.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
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
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg"
				>
					<div class="flex items-center">
						<div class="bg-chart-2/20 border-chart-2/30 rounded-lg border p-2">
							<svg class="text-chart-2 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Scalable Infrastructure</h3>
					</div>
					<p class="text-muted-foreground mt-4">
						Hosted with Cloudflare Workers and Supabase; free to start and cheap to scale.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
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
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg"
				>
					<div class="flex items-center">
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
					<p class="text-muted-foreground mt-4">
						Postgres RLS, rate limiting, IP blocking, and secure secret management.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
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
					class="bg-card border-border hover:border-primary/50 rounded-xl border p-6 transition-all hover:shadow-lg"
				>
					<div class="flex items-center">
						<div class="bg-chart-5/20 border-chart-5/30 rounded-lg border p-2">
							<svg class="text-chart-5 h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8a2 2 0 012 2v2H6V8z"
								/>
							</svg>
						</div>
						<h3 class="text-foreground ml-3 text-lg font-semibold">Payments & Billing</h3>
					</div>
					<p class="text-muted-foreground mt-4">
						Stripe integration with webhooks, subscription management, and secure payment processing
						built-in.
					</p>
					<div class="mt-4 flex flex-wrap gap-2">
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

	<!-- Demo Section -->
	<div id="demo" class="px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-6xl">
			<div class="mb-12 flex flex-col items-center gap-4 text-center">
				<h2 class="text-foreground text-3xl font-bold sm:text-4xl">This is the Demo</h2>
				<p class="text-muted-foreground mt-4 text-lg">
					If you are reading this, you are using the demo. Sign up or log in to see it in action.
				</p>
				<div class="mt-10 flex flex-col items-center gap-4 sm:flex-row">
					<Button size="xl" href="/auth/signup">Sign up</Button>
					<Button size="xl" href="/auth/signin" variant={'outline'}>Log in</Button>
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

	<!-- Quick Start -->
	<div class="px-4 py-20 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-4xl">
			<div class="text-center">
				<h2 class="text-foreground text-3xl font-bold sm:text-4xl">Get Started in Minutes</h2>
				<p class="text-muted-foreground mt-4 text-lg">
					Clone, configure, and deploy your fullstack application
				</p>
			</div>

			<div class="bg-card border-border mt-12 rounded-xl border p-8 shadow-lg">
				<div class="space-y-6">
					<div class="flex items-start space-x-4">
						<div class="flex-shrink-0">
							<div
								class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
							>
								1
							</div>
						</div>
						<div>
							<h3 class="text-foreground text-lg font-semibold">Clone the Repository</h3>
							<p class="text-muted-foreground mt-1">Get started with the template in seconds</p>
							<div class="bg-muted border-border mt-3 rounded-lg border p-4">
								<code class="text-chart-2 text-sm"
									>git clone https://github.com/yourusername/fullstack-ai-web-template.git</code
								>
							</div>
						</div>
					</div>

					<div class="flex items-start space-x-4">
						<div class="flex-shrink-0">
							<div
								class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
							>
								2
							</div>
						</div>
						<div>
							<h3 class="text-foreground text-lg font-semibold">Configure Environment</h3>
							<p class="text-muted-foreground mt-1">
								Set up your environment variables and secrets
							</p>
							<div class="bg-muted border-border mt-3 rounded-lg border p-4">
								<code class="text-chart-2 text-sm">cp .env.example .env && npm install</code>
							</div>
						</div>
					</div>

					<div class="flex items-start space-x-4">
						<div class="flex-shrink-0">
							<div
								class="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
							>
								3
							</div>
						</div>
						<div>
							<h3 class="text-foreground text-lg font-semibold">Deploy to Production</h3>
							<p class="text-muted-foreground mt-1">
								Automatic deployment with Terraform and GitHub Actions
							</p>
							<div class="bg-muted border-border mt-3 rounded-lg border p-4">
								<code class="text-chart-2 text-sm">npm run terraform:deploy && git push</code>
							</div>
						</div>
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
</style>
