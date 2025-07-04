<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import type { PageData } from './$types';
	import { formatDistanceToNow } from 'date-fns';

	let { data }: { data: PageData } = $props();

	const { invitations } = data;
</script>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Pending Invitations</h1>
		<p class="mt-1 text-gray-600">Review and manage your organization invitations</p>
	</div>

	{#if invitations.length === 0}
		<div class="rounded-lg bg-white p-8 text-center shadow-sm">
			<svg
				class="mx-auto mb-3 h-12 w-12 text-gray-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
			<h3 class="mb-1 text-lg font-medium text-gray-900">No pending invitations</h3>
			<p class="text-gray-500">You don't have any pending organization invitations.</p>
		</div>
	{:else}
		<div class="grid gap-4">
			{#each invitations as invitation}
				<div class="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="mb-2 flex items-center gap-4">
								{#if invitation.organization_logo_url}
									<img
										src={invitation.organization_logo_url}
										alt={invitation.organization_name}
										class="h-12 w-12 rounded-lg object-cover"
									/>
								{/if}
								<div>
									<h3 class="text-lg font-semibold">{invitation.organization_name}</h3>
									<p class="text-sm text-gray-500">
										Invited to join as <span class="font-medium capitalize">{invitation.role}</span>
									</p>
								</div>
							</div>

							{#if invitation.organization_description}
								<p class="mb-3 text-sm text-gray-600">{invitation.organization_description}</p>
							{/if}

							<div class="flex items-center gap-4 text-sm text-gray-500">
								<span
									>Expires {formatDistanceToNow(new Date(invitation.expires_at), {
										addSuffix: true
									})}</span
								>
								<span>•</span>
								<span>Sent to {invitation.email}</span>
							</div>
						</div>

						<div class="ml-4">
							<div class="flex justify-center gap-3">
								<form method="POST" action="?/accept" use:enhance>
									<input type="hidden" name="invitationId" value={invitation.id} />
									<Button type="submit" variant="default" size="lg">Accept Invitation</Button>
								</form>

								<form method="POST" action="?/decline" use:enhance>
									<input type="hidden" name="invitationId" value={invitation.id} />
									<Button type="submit" variant="outline" size="lg">Decline</Button>
								</form>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
