<script>
	import { Button } from '$lib/components/ui/button';

	const { data } = $props();
	const { error, login } = data;
</script>

<svelte:head>
	<title>Magic Link</title>
</svelte:head>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-4">
		{#if login}
			<h1 class="text-foreground text-4xl font-medium">Welcome!</h1>
			<p class="text-foreground">You've clicked a link to log in.</p>
			<Button href={login}>Log In</Button>
		{:else}
			<h3 class="text-destructive text-2xl font-medium">{error}</h3>
			<p class="text-foreground">
				Something went wrong while verifying your email. Please try again.
			</p>
		{/if}
	</div>
</div>
