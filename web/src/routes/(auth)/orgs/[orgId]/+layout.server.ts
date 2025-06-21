import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase }, params }) => {
	const { orgId } = params;

    // This is sets the current organization id for the user for use in RLS
    // If the user is not a member of the organization, or the organization does not exist
    // the value will be ignored and the user will not be able to access any organizations for this request.
    await supabase.rpc('set_current_organization_id', { org_id: orgId });

	return {};
};
