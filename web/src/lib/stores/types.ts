// types.ts

import type { ProfileSliceState, ProfileSliceActions } from './slices/profileSlice';
import type { Draft } from 'immer';

export type AppState = ProfileSliceState;

export type AppActions = {
	reset: () => void;
} & ProfileSliceActions;

export type AppUpdateOpts = Partial<AppState> | ((state: Draft<AppState>) => void);

type AppSliceProps = {
	set: (updater: AppUpdateOpts) => void;
	get: () => AppState;
};

export type AppSlice<A> = (props: AppSliceProps) => A;
