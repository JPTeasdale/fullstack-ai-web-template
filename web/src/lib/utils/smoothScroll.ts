import type { Action } from 'svelte/action';

/**
 * A Svelte action that provides smooth scrolling to page anchors
 * @param node - The DOM element to attach the action to
 */
export const smoothScroll: Action = (node) => {
	const handleClick = (e: MouseEvent) => {
		// Only process anchor elements
		const target = e.currentTarget as HTMLAnchorElement;
		if (!target || !(target instanceof HTMLAnchorElement)) return;

		// Only handle same-page hash links
		const href = target.getAttribute('href');
		if (!href || !href.startsWith('#')) return;

		// Get the target element
		const destinationId = href.substring(1);
		const destinationElement = document.getElementById(destinationId);
		if (!destinationElement) return;

		// Prevent default jump behavior
		e.preventDefault();

		// Scroll smoothly to the target
		destinationElement.scrollIntoView({
			behavior: 'smooth',
			block: 'start'
		});
	};

	node.addEventListener('click', handleClick);

	return {
		destroy() {
			node.removeEventListener('click', handleClick);
		}
	};
};
