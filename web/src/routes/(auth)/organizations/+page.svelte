<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { enhance } from '$app/forms';
	import { Building2, Plus, X } from '@lucide/svelte';
	import { URL_ORGANIZATIONS } from '$lib/url';

	const { data, form } = $props();
	const organizations = $derived(data.organizations ?? []);
	const profile = $derived(data.profile);
	
	let showCreateDialog = $state(false);
	let isCreating = $state(false);
</script>

<svelte:head>
	<title>Select Organization</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
				Select Organization
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Choose an organization to continue or create a new one
			</p>
		</div>

		<div class="mt-8 space-y-3">
			{#if organizations.length > 0}
				{#each organizations as organization}
					<a
						href={`${URL_ORGANIZATIONS}/${organization.id}`}
						class="group relative flex items-center rounded-lg border border-gray-300 bg-white px-6 py-4 shadow-sm transition-all hover:border-primary hover:shadow-md"
					>
						<div class="flex items-center space-x-3">
							<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 group-hover:bg-primary/10">
								<Building2 class="h-5 w-5 text-gray-600 group-hover:text-primary" />
							</div>
							<div>
								<h3 class="text-sm font-medium text-gray-900">{organization.name}</h3>
								{#if organization.description}
									<p class="text-sm text-gray-500">{organization.description}</p>
								{/if}
							</div>
						</div>
					</a>
				{/each}
			{:else}
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
					<Building2 class="mx-auto h-12 w-12 text-gray-400" />
					<p class="mt-2 text-sm text-gray-600">No organizations yet</p>
					<p class="text-sm text-gray-500">Create your first organization to get started</p>
				</div>
			{/if}

			<Button
				class="w-full"
				onclick={() => (showCreateDialog = true)}
			>
				<Plus class="mr-2 h-4 w-4" />
				New Organization
			</Button>
		</div>
	</div>
</div>

<!-- Create Organization Dialog -->
{#if showCreateDialog}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Backdrop -->
		<button
			class="absolute inset-0 bg-black/50"
			onclick={() => (showCreateDialog = false)}
			aria-label="Close dialog"
		></button>

		<!-- Dialog -->
		<div class="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold">Create New Organization</h3>
				<button
					onclick={() => (showCreateDialog = false)}
					class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<form
				method="POST"
				action="?/createOrganization"
				use:enhance={() => {
					isCreating = true;
					return async ({ result, update }) => {
						isCreating = false;
						if (result.type === 'redirect') {
							showCreateDialog = false;
						}
						await update();
					};
				}}
				class="space-y-4"
			>
				{#if form?.error}
					<div class="rounded-md bg-red-50 p-4">
						<p class="text-sm text-red-800">{form.error}</p>
					</div>
				{/if}

				<div>
					<Label for="name">Organization Name *</Label>
					<Input
						id="name"
						name="name"
						type="text"
						required
						placeholder="Acme Inc."
						value={form?.values?.name ?? ''}
						class="mt-1"
					/>
				</div>

				<div>
					<Label for="description">Description (Optional)</Label>
					<Textarea
						id="description"
						name="description"
						placeholder="What does your organization do?"
						value={form?.values?.description ?? ''}
						rows={3}
						class="mt-1"
					/>
				</div>

				<div class="flex justify-end space-x-3 pt-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => (showCreateDialog = false)}
						disabled={isCreating}
					>
						Cancel
					</Button>
					<Button type="submit" loading={isCreating}>
						Create Organization
					</Button>
				</div>
			</form>
		</div>
	</div>
{/if}
