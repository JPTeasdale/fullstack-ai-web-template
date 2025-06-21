import { writable, derived, type Readable } from 'svelte/store';

interface AnimatedTextState {
	text: string;
	generating: boolean;
}

/**
 * Creates an animated text store that gradually reveals text over time
 *
 * @param initialText The initial text to animate
 * @param initialDone Whether the animation is initially complete
 * @returns A store with the current text state and methods to update it
 */
export function createAnimatedText(
	initialText: string = '',
	initialDone: boolean = false
): Readable<AnimatedTextState> & {
	update: (text: string, done: boolean) => void;
} {
	// Internal state for the animation
	const state = writable({
		fullText: initialText,
		visibleLength: initialDone ? initialText.length : 0,
		done: initialDone
	});

	// Interval reference for cleanup
	let intervalId: ReturnType<typeof setInterval> | null = null;

	// Stop any running animation
	function stopAnimation() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	// Start animation process
	function startAnimation() {
		stopAnimation();

		// Get current values
		let currentState: { fullText: string; visibleLength: number; done: boolean };
		const unsubscribe = state.subscribe((s) => {
			currentState = s;
		});
		unsubscribe();

		if (currentState!.done) return;

		intervalId = setInterval(() => {
			state.update((s) => {
				if (s.visibleLength < s.fullText.length) {
					return {
						...s,
						visibleLength: s.visibleLength + 1
					};
				} else {
					stopAnimation();
					return s;
				}
			});
		}, 10);
	}

	// Create derived store for the public API
	const derivedStore = derived(state, ($state) => ({
		text: $state.fullText.slice(0, $state.visibleLength),
		generating: !$state.done
	}));

	// Update method
	function update(text: string, done: boolean) {
		stopAnimation();

		state.update((s) => ({
			fullText: text,
			visibleLength: done ? text.length : 0,
			done
		}));

		if (!done && text) {
			startAnimation();
		}
	}

	// Start initial animation if needed
	if (initialText && !initialDone) {
		startAnimation();
	}

	// Clean up on component destruction
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', stopAnimation);
	}

	// Return the public API
	return {
		subscribe: derivedStore.subscribe,
		update
	};
}
