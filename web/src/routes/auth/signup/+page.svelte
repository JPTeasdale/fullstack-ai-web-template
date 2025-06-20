<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { URL_SIGNIN } from '$lib/url';

	// Get form data from the server action
	let { form } = $props();

	let email = $state(form?.email ?? '');
	let password = $state('');
	let confirmPassword = $state('');
	let isSubmitting = $state(false);
	const shouldConfirm = $derived(form?.success && form?.message);

	const submitFunction: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ update, result }) => {
			await update({ reset: false });
			isSubmitting = false;
			console.log({ result });

			// if (result.status === 200) {
			// 	window.location.reload();
			// }
		};
	};
</script>

{#if shouldConfirm}
	<h2 class="my-4 text-center text-3xl font-extrabold text-gray-900">Confirm your email</h2>
	<div class="text-center">
		We sent an confirmation email to {email}.
	</div>

	<Button class="w-full" variant="ghost" onclick={() => window.location.reload()}>Reset</Button>
{:else}
	<h2 class="my-4 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
	<form class="w-full space-y-6" method="post" action="?/signup" use:enhance={submitFunction}>
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
					autocomplete="new-password"
					required
					bind:value={password}
				/>
			</div>
		</div>

		<div>
			<Label for="confirm-password">Confirm Password</Label>
			<div class="mt-1">
				<Input
					id="confirm-password"
					name="confirm-password"
					type="password"
					autocomplete="new-password"
					required
					bind:value={confirmPassword}
				/>
			</div>
		</div>

		<div>
			<Button type="submit" disabled={isSubmitting} class="w-full">
				{isSubmitting ? 'Creating account...' : 'Create account'}
			</Button>
		</div>

		<div
			class="flex w-full flex-col space-y-4 sm:flex-row sm:items-center sm:justify-center sm:space-y-0"
		>
			<div class="flex w-full justify-center text-center text-sm sm:text-left">
				<span class="text-gray-500">Already have an account?</span>
				<a href={URL_SIGNIN} class="ml-1 font-medium text-blue-600 hover:text-blue-500">
					Sign in
				</a>
			</div>
		</div>
	</form>
{/if}
