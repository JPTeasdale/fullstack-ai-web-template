<script>
	import { APP_NAME } from '$lib/app/constants.js';
	import { Button } from '$lib/components/ui/button';

	const { data } = $props();
	const { error, login } = data;
</script>

<svelte:head>
	<title>Confirm Email</title>
</svelte:head>

<h2 class="my-4 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>

<div class="flex flex-col gap-4">
	{#if login}
		<p class="text-foreground">You've clicked a magic link to log in to {APP_NAME}.</p>
		<Button href={login}>Log In</Button>
	{:else}
		<h3 class="text-destructive text-2xl font-medium">{error}</h3>
		<p class="text-foreground">
			Something went wrong while verifying your email. Please try again.
		</p>
	{/if}
</div>
