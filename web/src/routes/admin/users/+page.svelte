<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select';

	export let data: PageData;
	
	let selectedEmailType: Record<string, string> = {};
	let sendingEmail: Record<string, boolean> = {};
	
	const emailTypeLabels: Record<string, string> = {
		password_reset: 'Password Reset',
		magic_link: 'Magic Link Login',
		email_confirmation: 'Email Confirmation'
	};
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold mb-6">Users</h1>

	<div class="overflow-x-auto">
		<table class="min-w-full bg-white border border-gray-200">
			<thead>
				<tr class="bg-gray-50 border-b">
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Email
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						ID
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Created
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200">
				{#if data.users && data.users.length > 0}
					{#each data.users as user}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{user.email || 'No email'}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{user.user_id}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{new Date(user.created_at).toLocaleDateString()}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<form
									method="POST"
									action="?/sendEmail"
									use:enhance={() => {
										sendingEmail[user.user_id] = true;
										return async ({ result, update }) => {
											sendingEmail[user.user_id] = false;
											if (result.type === 'success') {
												selectedEmailType[user.user_id] = '';
											}
											await update();
										};
									}}
									class="flex items-center gap-2"
								>
									<input type="hidden" name="userId" value={user.user_id} />
									<input type="hidden" name="email" value={user.email} />
									
									<Select 
										value={selectedEmailType[user.user_id]} 
										onValueChange={(value) => {
											if (value) selectedEmailType[user.user_id] = value;
										}}
										type="single"
									>
										<SelectTrigger class="w-[180px]">
											{selectedEmailType[user.user_id] ? emailTypeLabels[selectedEmailType[user.user_id]] : 'Send email...'}
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="password_reset">Password Reset</SelectItem>
											<SelectItem value="magic_link">Magic Link Login</SelectItem>
											<SelectItem value="email_confirmation">Email Confirmation</SelectItem>
										</SelectContent>
									</Select>
									
									{#if selectedEmailType[user.user_id]}
										<input type="hidden" name="type" value={selectedEmailType[user.user_id]} />
										<Button 
											type="submit" 
											size="sm"
											disabled={sendingEmail[user.user_id]}
										>
											{sendingEmail[user.user_id] ? 'Sending...' : 'Send'}
										</Button>
									{/if}
								</form>
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="4" class="px-6 py-4 text-center text-gray-500">
							No users found
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
