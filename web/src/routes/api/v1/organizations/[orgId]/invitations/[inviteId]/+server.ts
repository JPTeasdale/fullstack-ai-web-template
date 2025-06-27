import { cancelInvitation } from '$lib/models/invitations';
import { createApiHandler, requireAuth } from '$lib/server/api/helpers';
import { noContentResponse } from '$lib/server/api/response';

export const DELETE = createApiHandler(async (event) => {
	const { orgId, inviteId } = event.params;

	await requireAuth(event);

	// Create org context - RLS will handle permission check
	const ctx = {
		...event.locals,
		user: event.locals.user!,
		organizationId: orgId!
	};

	await cancelInvitation(ctx, inviteId!);

	return noContentResponse();
});
