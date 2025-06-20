<script lang="ts">
	import TabsList from '$lib/components/ui/tabs/tabs-list.svelte';
	import TabsTrigger from '$lib/components/ui/tabs/tabs-trigger.svelte';
	import TabsContent from '$lib/components/ui/tabs/tabs-content.svelte';
	import Tabs from '$lib/components/ui/tabs/tabs.svelte';

	const { data } = $props();
</script>

{#each data.templates as template, idx}
	<div class="flex h-[1000px] w-full flex-col gap-4">
		<Tabs class="h-full w-full" value="html">
			<div class="flex flex-col items-center gap-2">
				<div class="flex flex-row items-center gap-4 p-4">
					<h1 class="text-2xl font-bold">{template.subject}</h1>
				</div>

				<TabsList class="inline-block">
					<TabsTrigger value="html">HTML</TabsTrigger>
					<TabsTrigger value="text">Text</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="html" class="h-full w-full">
				<iframe srcdoc={template.html} class="h-full w-full" />
			</TabsContent>
			<TabsContent value="text">
				<div class="flex flex-col items-center gap-2">
					<div class="pre-wrap max-w-lg flex-1">
						{template.text}
					</div>
				</div>
			</TabsContent>
		</Tabs>
	</div>
{/each}
