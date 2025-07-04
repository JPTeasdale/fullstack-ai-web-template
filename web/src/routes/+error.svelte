<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';

	$: status = page.status;
	$: errorMessage = page.error?.message || 'An unexpected error occurred';

	function getErrorTitle(status: number): string {
		switch (status) {
			case 404:
				return 'Page Not Found';
			case 403:
				return 'Access Forbidden';
			case 500:
				return 'Internal Server Error';
			case 503:
				return 'Service Unavailable';
			default:
				return 'Something Went Wrong';
		}
	}

	function getErrorDescription(status: number): string {
		switch (status) {
			case 404:
				return "The page you're looking for doesn't exist or has been moved.";
			case 403:
				return "You don't have permission to access this resource.";
			case 500:
				return "We're experiencing technical difficulties. Please try again later.";
			case 503:
				return 'The service is temporarily unavailable. Please try again in a few minutes.';
			default:
				return 'We encountered an unexpected error while processing your request.';
		}
	}
</script>

<svelte:head>
	<title>{status} - {getErrorTitle(status)}</title>
</svelte:head>

<div class="bg-background flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8 text-center">
		<!-- Error Status -->
		<div class="space-y-2">
			<div class="text-primary mb-4 text-6xl font-bold sm:text-7xl">
				{status}
			</div>
			<h1 class="text-foreground text-2xl font-semibold sm:text-3xl">
				{getErrorTitle(status)}
			</h1>
		</div>

		<!-- Error Description -->
		<div class="space-y-4">
			<p class="text-muted-foreground text-base sm:text-lg">
				{getErrorDescription(status)}
			</p>

			{#if errorMessage !== getErrorDescription(status)}
				<div class="bg-card border-border rounded-lg border p-4">
					<p class="text-muted-foreground font-mono text-sm break-words">
						{errorMessage}
					</p>
				</div>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="flex flex-col items-center justify-center gap-3 pt-6 sm:flex-row">
			<Button onclick={() => history.back()}>Go Back</Button>

			<Button href="/" variant="secondary">Go Home</Button>
		</div>

		<!-- Additional Help -->
		<div class="border-border border-t pt-8">
			<p class="text-muted-foreground text-sm">
				Need help?
				<a
					href="/contact"
					class="text-primary focus:ring-ring focus:ring-offset-background rounded hover:underline focus:ring-2 focus:ring-offset-2 focus:outline-none"
				>
					Contact Support
				</a>
			</p>
		</div>
	</div>
</div>

<style>
	/* Ensure the error page uses the full viewport */
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
	}
</style>
