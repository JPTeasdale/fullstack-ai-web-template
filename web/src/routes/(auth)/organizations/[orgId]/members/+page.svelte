<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import type { PageData } from './$types';
	import { invalidateAll } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let searchQuery = $state('');
	let showInviteModal = $state(false);
	let inviteEmail = $state('');
	let inviteRole = $state<'member' | 'admin'>('member');
	let isInviting = $state(false);
	let inviteError = $state('');

	// Filter members based on search query
	let filteredMembers = $derived(
		data.members.filter((member: any) => {
			const query = searchQuery.toLowerCase();
			const profile = member.user_profiles;
			return (
				profile?.email?.toLowerCase().includes(query) ||
				profile?.full_name?.toLowerCase().includes(query) ||
				profile?.display_name?.toLowerCase().includes(query)
			);
		})
	);

	async function inviteMember() {
		isInviting = true;
		inviteError = '';

		try {
			const response = await fetch(`/api/v1/organizations/${data.organization?.id}/invitations`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					email: inviteEmail,
					role: inviteRole
				})
			});

			if (response.ok) {
				showInviteModal = false;
				inviteEmail = '';
				inviteRole = 'member';
				await invalidateAll();
			} else {
				const error = await response.json();
				inviteError = error.message || 'Failed to send invitation';
			}
		} catch (error) {
			inviteError = 'An error occurred while sending the invitation';
		} finally {
			isInviting = false;
		}
	}

	async function cancelInvitation(invitationId: string) {
		if (!confirm('Are you sure you want to cancel this invitation?')) {
			return;
		}

		try {
			const response = await fetch(
				`/api/v1/organizations/${data.organization?.id}/invitations/${invitationId}`,
				{
					method: 'DELETE'
				}
			);

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to cancel invitation:', error);
		}
	}

	async function updateMemberRole(memberId: string, newRole: string) {
		try {
			const response = await fetch(
				`/api/v1/organizations/${data.organization?.id}/members/${memberId}`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ role: newRole })
				}
			);

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to update member role:', error);
		}
	}

	async function removeMember(memberId: string) {
		if (!confirm('Are you sure you want to remove this member from the organization?')) {
			return;
		}

		try {
			const response = await fetch(
				`/api/v1/organizations/${data.organization?.id}/members/${memberId}`,
				{
					method: 'DELETE'
				}
			);

			if (response.ok) {
				await invalidateAll();
			}
		} catch (error) {
			console.error('Failed to remove member:', error);
		}
	}

	function getRoleBadgeColor(role: string) {
		switch (role) {
			case 'owner':
				return 'bg-purple-100 text-purple-800';
			case 'admin':
				return 'bg-blue-100 text-blue-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div class="mx-auto w-full">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">Members</h1>
		<p class="mt-2 text-gray-600">
			Manage members of {data.organization?.name}
		</p>
	</div>

	<!-- Search and Actions Bar -->
	<div class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div class="relative max-w-md flex-1">
			<Input
				type="search"
				placeholder="Search members by name or email..."
				bind:value={searchQuery}
				class="pl-10"
			/>
			<svg
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
		</div>

		{#if data.canManageMembers}
			<Button onclick={() => (showInviteModal = true)}>
				<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				Invite Member
			</Button>
		{/if}
	</div>

	<!-- Tabs for Members and Invitations -->
	<Tabs value="members" class="space-y-4">
		<TabsList class="grid w-full max-w-md grid-cols-2">
			<TabsTrigger value="members">Members ({data.members.length})</TabsTrigger>
			{#if data.canManageMembers}
				<TabsTrigger value="invitations">Invitations ({data.invitations.length})</TabsTrigger>
			{/if}
		</TabsList>

		<!-- Members Tab -->
		<TabsContent value="members">
			<div class="overflow-hidden rounded-lg bg-white shadow">
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th
									class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
								>
									Member
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
								>
									Role
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
								>
									Joined
								</th>
								{#if data.canManageMembers}
									<th
										class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
									>
										Actions
									</th>
								{/if}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each filteredMembers as member}
								<tr class="transition-colors hover:bg-gray-50">
									<td class="whitespace-nowrap px-6 py-4">
										<div class="flex items-center">
											<div class="h-10 w-10 flex-shrink-0">
												{#if member.user_profiles.avatar_url}
													<img
														class="h-10 w-10 rounded-full object-cover"
														src={member.user_profiles.avatar_url}
														alt={member.user_profiles.full_name || member.user_profiles.email}
													/>
												{:else}
													<div
														class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300"
													>
														<span class="font-medium text-gray-600">
															{(member.user_profiles.full_name || member.user_profiles.email)
																.charAt(0)
																.toUpperCase()}
														</span>
													</div>
												{/if}
											</div>
											<div class="ml-4">
												<div class="text-sm font-medium text-gray-900">
													{member.user_profiles.full_name ||
														member.user_profiles.display_name ||
														'Unknown'}
												</div>
												<div class="text-sm text-gray-500">
													{member.user_profiles.email}
												</div>
											</div>
										</div>
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										{#if data.canManageMembers && member.role !== 'owner'}
											<Select
												value={member.role}
												onValueChange={(value) => updateMemberRole(member.id, value)}
												type="single"
											>
												<SelectTrigger class="w-32">
													<span
														class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
													>
														{member.role}
													</span>
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="member">Member</SelectItem>
													<SelectItem value="admin">Admin</SelectItem>
												</SelectContent>
											</Select>
										{:else}
											<span
												class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(member.role)}`}
											>
												{member.role}
											</span>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
										{new Date(member.joined_at).toLocaleDateString()}
									</td>
									{#if data.canManageMembers}
										<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
											<Button
												disabled={member.role === 'owner'}
												onclick={() => removeMember(member.id)}
												variant="ghost"
												class="text-destructive"
											>
												Remove
											</Button>
										</td>
									{/if}
								</tr>
							{:else}
								<tr>
									<td
										colspan={data.canManageMembers ? 4 : 3}
										class="px-6 py-12 text-center text-gray-500"
									>
										{searchQuery ? 'No members found matching your search.' : 'No members found.'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</TabsContent>

		<!-- Invitations Tab -->
		{#if data.canManageMembers}
			<TabsContent value="invitations">
				<div class="overflow-hidden rounded-lg bg-white shadow">
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
									>
										Email
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
									>
										Role
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
									>
										Invited By
									</th>
									<th
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
									>
										Sent At
									</th>
									<th
										class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
									>
										Actions
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white">
								{#each data.invitations as invitation}
									<tr class="transition-colors hover:bg-gray-50">
										<td class="whitespace-nowrap px-6 py-4">
											<div class="text-sm font-medium text-gray-900">
												{invitation.email}
											</div>
										</td>
										<td class="whitespace-nowrap px-6 py-4">
											<span
												class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}
											>
												{invitation.role}
											</span>
										</td>
										<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
											{invitation.invited_by_email || 'Unknown'}
										</td>
										<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
											{new Date(invitation.created_at).toLocaleDateString()}
										</td>
										<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
											<button
												onclick={() => cancelInvitation(invitation.id)}
												class="text-red-600 transition-colors hover:text-red-900"
											>
												Cancel
											</button>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="5" class="px-6 py-12 text-center text-gray-500">
											No pending invitations.
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</TabsContent>
		{/if}
	</Tabs>

	<!-- Invite Modal -->
	<Dialog.Root bind:open={showInviteModal}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Invite New Member</Dialog.Title>
			</Dialog.Header>

			<div class="w-full max-w-md rounded-lg bg-white">
				{#if inviteError}
					<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
						<p class="text-sm text-red-800">{inviteError}</p>
					</div>
				{/if}

				<div class="space-y-4">
					<div class="text-muted-foreground text-sm">
						Invite a new member to the <strong>{data.organization?.name}</strong> organization.
						They will recieve an email with a link to join.
					</div>
					<div class="space-y-2">
						<Label for="email">Email Address</Label>
						<Input
							id="email"
							type="email"
							bind:value={inviteEmail}
							placeholder="member@example.com"
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="role">Role</Label>
						<Select bind:value={inviteRole} type="single">
							<SelectTrigger id="role">
								{inviteRole}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="member">Member</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<div class="mt-6 flex justify-end gap-3">
					<Button
						variant="outline"
						onclick={() => {
							showInviteModal = false;
							inviteEmail = '';
							inviteError = '';
						}}
					>
						Cancel
					</Button>
					<Button onclick={inviteMember} disabled={isInviting || !inviteEmail}>
						{isInviting ? 'Sending...' : 'Send Invitation'}
					</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
</div>
