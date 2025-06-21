export const textautosize = (node: HTMLTextAreaElement, enabled: boolean = true) => {
	const resize = () => {
		if (!enabled) return;
		node.style.height = 'auto';
		node.style.height = node.scrollHeight + 'px';
	};
	node.addEventListener('input', resize);
	resize();
	return {
		destroy: () => node.removeEventListener('input', resize)
	};
};
