// src/routes/api/logout/+server.ts
import { createApiHandler } from '$lib/server/api/helpers';
import { successResponse } from '$lib/server/api/response';

export const POST = createApiHandler(async ({ locals, cookies }) => {
	await locals.supabase.auth.signOut();

	// Clear cookies
	cookies.delete('sb-access-token', { path: '/' });
	cookies.delete('sb-refresh-token', { path: '/' });

	return successResponse({ success: true });
});
