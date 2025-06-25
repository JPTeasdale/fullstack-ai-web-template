<script lang="ts">
	import Button from '../ui/button/button.svelte';
	import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
	import { APP_NAME } from '$lib/app/constants';
	import AppIcon from '$lib/app/AppIcon.svelte';
	import type { User } from '@supabase/supabase-js';
	import type { Snippet } from 'svelte';
	const {
		user,
		onSignOut,
		contextItems
	}: {
		user?: User;
		onSignOut: () => Promise<void>;
		contextItems?: Snippet;
	} = $props();
</script>

<header class="fixed top-0 left-0 right-0 z-10 bg-background max-w-screen shadow sm:m-3 sm:rounded">
	<div class="mx-auto flex h-16 items-center justify-between p-4">
		<a
			class="flex h-full items-center gap-2 truncate whitespace-nowrap text-xl font-semibold text-gray-900"
			href="/"
		>
			<AppIcon class="h-10 w-10" />
			{APP_NAME}
		</a>

		{#if user}
			<Popover>
				<PopoverTrigger>
					<Button
						type="button"
						variant="ghost"
						class="focus:ring-primary space-x-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
						id="user-menu-button"
						aria-haspopup="true"
					>
						<!-- You might want a user avatar here eventually -->
						<!-- <img class="h-8 w-8 rounded-full" src="user-avatar.png" alt=""> -->
						<span class="ml-2 hidden text-sm font-medium text-gray-700 sm:block lg:block">
							<span class="sr-only">Open user menu for </span>{user.email}
						</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-6 h-5 w-5 shrink-0 text-gray-400 lg:block"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
							/>
						</svg>
					</Button>
				</PopoverTrigger>

				<PopoverContent>
					<div class="test-grey flex flex-col border-b p-4 text-sm sm:hidden">
						{user.email}
					</div>
					{@render contextItems?.()}
					<Button
						variant="ghost"
						class="text-destructive block w-full px-4 text-left"
						role="menuitem"
						tabindex={-1}
						onclick={onSignOut}
					>
						Sign Out
					</Button>
				</PopoverContent>
			</Popover>
		{:else}
			<!-- Optional: Show a Login button or something else if no user -->
		{/if}
	</div>
</header>

<div class="min-h-18 sm:min-h-20 w-full invisible">
test
</div>
