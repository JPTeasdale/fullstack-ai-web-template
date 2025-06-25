<script lang="ts">
	import AiWindow from '$lib/components/AIWindow/AIWindow.svelte';
	import Header from '$lib/components/Header/Header.svelte';
	import Sidebar from '$lib/components/Sidebar/Sidebar.svelte';
	import Chat from '$lib/ai/svelte/components/chat/Chat.svelte';
	import { AiConversationStore } from '$lib/ai/svelte/store/createAiStore';
	import {
		URL_API_SIGNOUT,
		URL_DASHBOARD,
		URL_ORGANIZATIONS,
		urlOrganization,
		urlOrganizationMembers,
		urlOrganizationFiles,
		urlOrganizationSubscription
	} from '$lib/url';
	import { Cog, Building2, Users, CreditCard, Files } from '@lucide/svelte';
	import SidebarLink from '$lib/components/Sidebar/SidebarLink.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import FullLayout from '$lib/components/Layout/FullLayout.svelte';
	let { children, data } = $props();
	const user = $derived(data.user);
	const organization = $derived(data.organization);
	const orgId = $derived(organization.id);

	const onSignOut = async () => {
		const res = await fetch(URL_API_SIGNOUT, {
			method: 'POST'
		});
		if (res.ok) {
			window.location.reload();
		}
	};

	const { generating, conversation, sendMessage, conversationError } = new AiConversationStore({
		handleAiFunctionCall: () => console.log
	});

	const items = $derived($conversation);
	const handleSendMessage = async (message: string) => {
		await sendMessage(`/api/v1/organizations/${orgId}/handle-turn`, message);
	};
</script>

<FullLayout>
	{#snippet header()}
		<Header {user} {onSignOut}>
			{#snippet contextItems()}
				<Button
					variant="ghost"
					class="block w-full px-4 text-left"
					role="menuitem"
					tabindex={-1}
					href={URL_ORGANIZATIONS}
				>
					Switch Organization
				</Button>
				<Button
					variant="ghost"
					class="block w-full px-4 text-left"
					role="menuitem"
					tabindex={-1}
					href={URL_DASHBOARD}
				>
					Switch to Dashboard View
				</Button>
			{/snippet}
		</Header>
	{/snippet}
	{#snippet sideNavItems(isExpanded)}
		<SidebarLink
			{isExpanded}
			href={urlOrganization(orgId)}
			label={organization.name}
			Icon={Building2}
		/>
		<SidebarLink {isExpanded} href={urlOrganizationMembers(orgId)} label="Members" Icon={Users} />
		<SidebarLink {isExpanded} href={urlOrganizationFiles(orgId)} label="Files" Icon={Files} />
		<SidebarLink
			{isExpanded}
			href={urlOrganizationSubscription(orgId)}
			label="Subscription"
			Icon={CreditCard}
		/>
	{/snippet}
	{#snippet chat()}
		<Chat onSendMessage={handleSendMessage} generating={$generating} {items} error={$conversationError} />
	{/snippet}
	{@render children()}
</FullLayout>
