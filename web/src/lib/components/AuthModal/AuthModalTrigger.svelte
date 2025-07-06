<script lang="ts">
	import { authModal } from '$lib/stores/authModal';
	import { Button } from '$lib/components/ui/button';

	let {
		variant = 'default',
		size = 'default',
		class: className = ''
	}: {
		variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
		size?: 'default' | 'sm' | 'lg' | 'icon';
		class?: string;
	} = $props();
</script>

<Button {variant} {size} class={className} onclick={() => authModal.open('signup')}>
	Sign in / Sign up
</Button>
