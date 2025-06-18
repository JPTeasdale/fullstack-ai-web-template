import type { AuthSession } from '@supabase/supabase-js';
import { getContext, setContext } from 'svelte';
import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

const AUTH_STORE_KEY = 'auth_store';

function createAuthStore(initialSession: AuthSession | null) {
	const { subscribe, set, update } = writable<AuthSession | null>(initialSession);

	return {
		subscribe,
		set,
		update,
		// Helper method to safely update the session
		setSession: (session: AuthSession | null) => set(session)
	};
}

export function setAuthStore(session: AuthSession | null) {
	const store = createAuthStore(session);
	setContext(AUTH_STORE_KEY, store);
	return store;
}

export function getAuthStore(): Writable<AuthSession | null> {
	const store = getContext<ReturnType<typeof createAuthStore>>(AUTH_STORE_KEY);
	
	if (!store) {
		// Fallback for cases where context isn't available
		// This should not happen in normal usage but provides safety
		if (browser) {
			console.warn('Auth store context not found, creating fallback store');
		}
		return createAuthStore(null);
	}
	
	return store;
}

// Helper function for debugging - gets current auth state
export function getCurrentAuthState(): AuthSession | null {
	if (!browser) return null;
	
	try {
		const store = getAuthStore();
		let currentValue: AuthSession | null = null;
		store.subscribe(value => currentValue = value)();
		return currentValue;
	} catch {
		return null;
	}
}