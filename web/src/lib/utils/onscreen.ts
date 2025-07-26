export function isOnScreen(element: HTMLElement, callback: (isVisible: boolean) => void) {
	let isVisible = false;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (isVisible !== entry.isIntersecting) {
					callback(entry.isIntersecting);
					isVisible = entry.isIntersecting;
				}
			});
		},
		{
			threshold: 0.1, // Trigger when 10% of the element is visible
			rootMargin: '0px 0px -50px 0px' // Trigger slightly before fully in view
		}
	);

	if (element) {
		observer.observe(element);
	}

	return () => {
		if (element) {
			observer.unobserve(element);
		}
	};
}

type VisibleStylesProps = {
	onScreen: string;
	offScreen: string;
};
const VisibleStylesPresets: Record<string, { onScreen: string; offScreen: string }> = {
	slideup: {
		onScreen: 'translate-y-0 opacity-100',
		offScreen: 'translate-y-8 opacity-0'
	},
	slideleft: {
		onScreen: 'translate-x-0 opacity-100',
		offScreen: 'translate-x-8 opacity-0'
	},
	slideright: {
		onScreen: 'translate-x-0 opacity-100',
		offScreen: '-translate-x-8 opacity-0'
	}
};

export function visibleStyles(
	element: HTMLElement,
	opts: VisibleStylesProps | keyof typeof VisibleStylesPresets
) {
	if (typeof opts === 'string') {
		opts = VisibleStylesPresets[opts];
	}

	const { onScreen, offScreen } = opts;

	const onClasses = onScreen.split(' ');
	const offClasses = offScreen.split(' ');
	const destroy = isOnScreen(element, (isVisible) => {
		if (isVisible) {
			element.classList.remove(...offClasses);
			element.classList.add(...onClasses);
		} else {
			element.classList.remove(...onClasses);
			element.classList.add(...offClasses);
		}
	});

	return {
		destroy
	};
}
