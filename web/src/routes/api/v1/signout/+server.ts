// src/routes/api/logout/+server.ts
import { createApiHandler } from '$lib/server/helpers/api_helpers';
import { successResponse } from '$lib/server/helpers/response';

export const POST = createApiHandler(async ({ locals, cookies }) => {
	await locals.supabase.auth.signOut();

	// Clear cookies
	cookies.delete('sb-access-token', { path: '/' });
	cookies.delete('sb-refresh-token', { path: '/' });

	return successResponse({ success: true });
});
