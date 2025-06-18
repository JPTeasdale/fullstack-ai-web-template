<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { URL_SIGNUP } from '$lib/url.js';

	// Get form data from the server action
	let { form } = $props();

	let email = $state(form?.email ?? '');
	let password = $state('');
	let isSubmitting = $state(false);

	const submitFunction: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ update, result }) => {
			await update({ reset: false });
			isSubmitting = false;
			if (result.status === 200) {
				window.location.reload();
			}
		};
	};
</script>

<h2 class="my-4 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
<form class="w-full space-y-6" method="post" action="?/signin" use:enhance={submitFunction}>
	{#if form?.error}
		<div class="rounded-md bg-red-50 p-4">
			<div class="text-sm text-red-700">{form.error}</div>
		</div>
	{/if}

	<div>
		<Label for="email">Email address</Label>
		<div class="mt-1">
			<Input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				bind:value={email}
			/>
		</div>
	</div>

	<div>
		<Label for="password">Password</Label>
		<div class="mt-1">
			<Input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				bind:value={password}
			/>
		</div>
	</div>

	<div>
		<Button type="submit" disabled={isSubmitting} class="w-full" loading={isSubmitting}>
			Sign in
		</Button>
	</div>

	<div
		class="flex w-full flex-col space-y-4 sm:flex-row sm:items-center sm:justify-center sm:space-y-0"
	>
		<div class="flex w-full justify-center text-center text-sm sm:text-left">
			<span class="text-gray-500">Don't have an account?</span>
			<a href={URL_SIGNUP} class="ml-1 font-medium text-blue-600 hover:text-blue-500"> Sign up </a>
		</div>
	</div>
</form>
