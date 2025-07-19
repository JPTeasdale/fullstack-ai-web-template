import type { Tables } from '$lib/types/generated/supabase.types';
import type { AppSlice } from '../types';

export interface ProfileSliceState {
	profile: Tables<'user_profiles'> | null;
	profileLoading: boolean;
}

export interface ProfileSliceActions {
	profileFetch: () => Promise<void>;
}

export const SLICE_PROFILE_DEFAULT: ProfileSliceState = {
	profile: null,
	profileLoading: false
} as const;

export const createProfileSlice: AppSlice<ProfileSliceActions> = ({ set, get }) => {
	async function profileFetch() {
		set({
			profileLoading: true
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));

		set({
			profileLoading: false,
			profile: null
		});
	}

	return {
		profileFetch
	};
};
