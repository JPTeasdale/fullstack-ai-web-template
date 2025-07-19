import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { createProfileSlice, SLICE_PROFILE_DEFAULT } from './slices/profileSlice';
import type { AppState, AppUpdateOpts } from './types';
import { produce } from 'immer';

export function createAppStore() {
	const { subscribe, update, set } = writable<Readonly<AppState>>({
		...SLICE_PROFILE_DEFAULT
	});

	function immutableSet(fnOrUpdate: AppUpdateOpts) {
		update((state) =>
			produce(state, (draft) => {
				if (typeof fnOrUpdate === 'function') {
					fnOrUpdate(draft);
				} else {
					Object.assign(draft, fnOrUpdate);
				}
			})
		);
	}

	function get() {
		let val;
		subscribe((v) => (val = v))();
		return val!;
	}

	const context = { set: immutableSet, get };

	return {
		subscribe,
		...createProfileSlice(context)
	};
}

export function appSelect<T>(
	store: Writable<AppState>,
	selector: (state: AppState) => T
): Readable<T> {
	let previous: T;

	return derived(store, (state, set) => {
		const selected = selector(state);

		if (!shallowEqual(previous, selected)) {
			previous = selected;
			set(selected);
		}
	});
}

function shallowEqual(a: any, b: any): boolean {
	if (a === b) return true;
	if (typeof a !== 'object' || !a || typeof b !== 'object' || !b) return false;

	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) return false;

	for (const key of keysA) {
		if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
		if (a[key] !== b[key]) return false;
	}

	return true;
}
