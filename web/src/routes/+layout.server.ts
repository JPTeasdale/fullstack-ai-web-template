import { ses } from '$lib/server/svelte_handlers/hook_clients';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
	const { session } = await safeGetSession();

	return {
		user: session?.user,
		cookies: cookies.getAll()
	};
};
