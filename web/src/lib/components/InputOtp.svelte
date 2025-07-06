<script lang="ts">
	import type { FormEventHandler, HTMLInputAttributes } from 'svelte/elements';
	import { onMount } from 'svelte';
	let {
		numInputs = 6,
		onComplete,
		value,
		name,
		...props
	}: HTMLInputAttributes & {
		numInputs: number;
		onComplete: (code: string) => void;
	} = $props(); // Current OTP code
	const inputRefs = Array(numInputs).fill(null);
	let code = $state('');

	$effect(() => {
		if (code.length >= numInputs) {
			onComplete(code.slice(0, numInputs));
		}
	});

	function replaceAt(str: string, replacement: string, index: number): string {
		return str.substring(0, index) + replacement + str.substring(index + replacement.length);
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		if (e.clipboardData) {
			code = e.clipboardData.getData('text/plain').substring(0, numInputs);
		}
	}

	function handleKeyDown(e: KeyboardEvent, idx: number) {
		if (e.key === 'Backspace') {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			code = code.substring(0, idx) + code.substring(idx + 1);
			if (idx > 0) {
				inputRefs[idx - 1].focus();
			}
		}
	}

	function handleInput(
		e: Event & {
			currentTarget: EventTarget & HTMLInputElement;
		},
		idx: number
	) {
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		const newValue = e.currentTarget?.value.replace(/\D/g, '');
		if (newValue) {
			code = replaceAt(code, newValue, idx).substring(0, numInputs);
			if (inputRefs.length > idx + 1) {
				inputRefs[idx + 1].focus();
			}
		} else {
			inputRefs[idx].value = code.length > idx ? code[idx] : '';
			inputRefs[idx].select();
		}
	}

	function handleFocus(idx: number) {
		const i = idx > code.length ? code.length : idx;
		inputRefs[i].focus();
		inputRefs[i].select();
	}
	onMount(() => {
		handleFocus(0);
	});
</script>

<div class="flex justify-between gap-1">
	{#each { length: numInputs } as _, idx}
		<input
			type="text"
			maxlength="1"
			value={code[idx] || ''}
			onpaste={handlePaste}
			onkeydown={(e) => handleKeyDown(e, idx)}
			oninput={(e) => handleInput(e, idx)}
			onfocus={() => handleFocus(idx)}
			bind:this={inputRefs[idx]}
			class="h-12 w-12 p-1 text-center"
			autocomplete="one-time-code"
			inputmode="numeric"
			{...props}
		/>
	{/each}
	<input type="hidden" value={code} {name} />
</div>

<style>
	input {
		border: 1px solid #ccc;
		border-radius: 4px;
		outline: none;
	}

	input:focus {
		border-color: #007bff;
		box-shadow: 0 0 3px #007bff;
	}
</style>
