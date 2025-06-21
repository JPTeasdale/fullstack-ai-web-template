<script module>
	import { Button } from '$lib/components/ui/button';
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';

	// More on how to set up stories at: https://storybook.js.org/docs/writing-stories
	const { Story } = defineMeta({
		title: 'Shadcn/Button',
		component: Button,
		tags: ['autodocs'],
		argTypes: {
			size: {
				control: { type: 'select' }
			},
			loading: {
				control: { type: 'boolean' }
			},
			variant: {
				control: { type: 'select' }
			},
			class: {
				control: { type: 'text' }
			}
		},
		args: {
			onclick: () => window.alert('Button clicked')
		}
	});
</script>

<!-- More on writing stories with args: https://storybook.js.org/docs/writing-stories/args -->
<Story name="Primary">Sign in</Story>
