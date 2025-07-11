import { cancelInvitation } from '$lib/server/models/invitations';
import { createOrganizationApiHandler } from '$lib/server/helpers/api_helpers';
import { noContentResponse } from '$lib/server/helpers/response';
import { ConfigurationError } from '$lib/server/errors';

export const DELETE = createOrganizationApiHandler(async (event) => {
	const { inviteId } = event.params;

	if (!inviteId) {
		throw new ConfigurationError('Invite ID is required');
	}

	await cancelInvitation(event, event.organizationId, inviteId);

	return noContentResponse();
});
