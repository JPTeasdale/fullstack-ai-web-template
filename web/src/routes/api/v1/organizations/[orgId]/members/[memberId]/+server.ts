import { updateMemberRole, removeMember } from '$lib/models/members';
import { createValidatedApiHandler, createApiHandler, requireAuth } from '$lib/server/api/helpers';
import { successResponse, noContentResponse } from '$lib/server/api/response';
import { updateMemberRoleSchema } from '$lib/schemas/organizations';

export const PATCH = createValidatedApiHandler(updateMemberRoleSchema, async (event) => {
	const { orgId, memberId } = event.params;
	const { role } = event.validated;

	await requireAuth(event);

	// Create org context - RLS will handle permission check
	const ctx = {
		...event.locals,
		user: event.locals.user!,
		organizationId: orgId!
	};

	await updateMemberRole(ctx, memberId!, role);

	return successResponse({ success: true });
});

export const DELETE = createApiHandler(async (event) => {
	const { orgId, memberId } = event.params;

	await requireAuth(event);

	// Create org context - RLS will handle permission check
	const ctx = {
		...event.locals,
		user: event.locals.user!,
		organizationId: orgId!
	};

	await removeMember(ctx, memberId!);

	return noContentResponse();
});
