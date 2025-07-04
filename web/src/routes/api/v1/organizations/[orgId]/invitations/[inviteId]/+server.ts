import { cancelInvitation } from '$lib/server/models/invitations';
import { assertAuthenticated, extractOrganizationId } from '$lib/server/api/context';
import { createOrganizationApiHandler } from '$lib/server/api/helpers';
import { noContentResponse } from '$lib/server/api/response';
import { ConfigurationError } from '$lib/server/errors';

export const DELETE = createOrganizationApiHandler(async (event) => {
	assertAuthenticated(event);
	const organizationId = extractOrganizationId(event);

	const { inviteId } = event.params;

	if (!inviteId) {
		throw new ConfigurationError('Invite ID is required');
	}

	await cancelInvitation(event, organizationId, inviteId);

	return noContentResponse();
});
