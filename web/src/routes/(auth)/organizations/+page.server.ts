import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { URL_ORGANIZATIONS } from '$lib/url';

// Simple slug generation function
function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export const actions = {
	createOrganization: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string | null;

		// Validate inputs
		if (!name || name.trim().length === 0) {
			return fail(400, {
				error: 'Organization name is required',
				values: { name, description }
			});
		}

		const slug = generateSlug(name);
		
		// Check if slug is valid
		if (!slug || slug.length < 3) {
			return fail(400, {
				error: 'Organization name must contain at least 3 alphanumeric characters',
				values: { name, description }
			});
		}

		const { data, error } = await locals.supabase.rpc('create_organization_with_owner', {
			org_name: name.trim(),
			org_slug: slug,
			org_description: description?.trim() || undefined
		});

		if (error) {
			// Check if it's a unique constraint violation
			if (error.code === '23505' && error.message.includes('organizations_slug_key')) {
				return fail(400, {
					error: 'An organization with this name already exists. Please choose a different name.',
					values: { name, description }
				});
			}
			
			return fail(400, {
				error: error.message || 'Failed to create organization',
				values: { name, description }
			});
		}

		// Redirect to the new organization page
		throw redirect(303, `${URL_ORGANIZATIONS}/${data}`);
	}
} satisfies Actions; 