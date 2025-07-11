import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { URL_ORGANIZATIONS } from '$lib/url';
import {
	createAuthenticatedActionHandler,
	validateFormAction
} from '$lib/server/helpers/action_helpers';
import { createOrganizationSchema } from '$lib/schemas/organizations';
import { createOrganization } from '$lib/server/models/organizations';

export const actions = {
	createOrganization: createAuthenticatedActionHandler(async (event) => {
		const validated = await validateFormAction(createOrganizationSchema, event);
		const org = await createOrganization(event, validated);

		// Redirect to the new organization page
		throw redirect(303, `${URL_ORGANIZATIONS}/${org.id}`);
	})
} satisfies Actions;
