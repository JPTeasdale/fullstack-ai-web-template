import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {

    // Scoping to the orgId is not necessary here because our RLS policies prohibit
    // accessing non-active organizations.
	const { data: organization, error: organizationError } = await supabase
		.from('organizations')
		.select('*')
		.maybeSingle();

    if (organizationError) {
        throw error(500, 'Error fetching organization');
    }

    if (!organization) {
        throw error(404, 'Organization not found');
    }

	return { organization };
};
