import { writable } from 'svelte/store';

interface AuthModalState {
	isOpen: boolean;
	mode: 'signin' | 'signup';
}

function createAuthModalStore() {
	const { subscribe, set, update } = writable<AuthModalState>({
		isOpen: false,
		mode: 'signup'
	});

	return {
		subscribe,
		open: (mode: 'signin' | 'signup' = 'signup') => {
			set({ isOpen: true, mode });
		},
		close: () => {
			update((state) => ({ ...state, isOpen: false }));
		},
		setMode: (mode: 'signin' | 'signup') => {
			update((state) => ({ ...state, mode }));
		}
	};
}

export const authModal = createAuthModalStore();
