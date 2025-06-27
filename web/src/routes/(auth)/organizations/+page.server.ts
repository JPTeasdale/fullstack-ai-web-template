import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { URL_ORGANIZATIONS } from '$lib/url';
import { createAuthenticatedValidatedActionHandler } from '$lib/server/actions/helpers';
import { createOrganizationSchema } from '$lib/schemas/organizations';
import { createOrganization } from '$lib/models/organizations';

export const actions = {
	createOrganization: createAuthenticatedValidatedActionHandler(
		createOrganizationSchema,
		async ({ body, ctx }) => {
			const org = await createOrganization(ctx, body);
			
			// Redirect to the new organization page
			throw redirect(303, `${URL_ORGANIZATIONS}/${org.id}`);
		}
	)
} satisfies Actions; 