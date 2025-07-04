import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { URL_ORGANIZATIONS } from '$lib/url';
import { createAuthenticatedValidatedActionHandler } from '$lib/server/actions/helpers';
import { createOrganizationSchema } from '$lib/schemas/organizations';
import { createOrganization } from '$lib/server/models/organizations';

export const actions = {
	createOrganization: createAuthenticatedValidatedActionHandler(
		createOrganizationSchema,
		async (event) => {
			const org = await createOrganization(event, event.body);

			// Redirect to the new organization page
			throw redirect(303, `${URL_ORGANIZATIONS}/${org.id}`);
		}
	)
} satisfies Actions;
