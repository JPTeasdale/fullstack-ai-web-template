import { NotFoundError, OperationError, ConflictError } from "$lib/errors";
import type { AuthenticatedContext, OrgContext } from "$lib/models/context";
import type { CreateOrganizationData, UpdateOrganizationData } from "$lib/schemas/organizations";

/**
 * Get an organization by ID
 * RLS ensures user can only access organizations they're a member of
 */
export const getOrganization = async (ctx: AuthenticatedContext, id: string) => {
    const { supabase } = ctx;

    const { data: organization, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new NotFoundError('Organization');
        }
        throw new OperationError(
            `Failed to fetch organization: ${error.message}`,
            'database.fetch',
            { orgId: id, errorCode: error.code }
        );
    }

    return organization;
};

/**
 * Get all organizations for the current user
 * RLS automatically filters to only organizations the user is a member of
 */
export const getUserOrganizations = async (ctx: AuthenticatedContext) => {
    const { supabase, user } = ctx;

    const { data: organizations, error } = await supabase
        .from('organizations')
        .select(`
            *,
            organization_members!inner(
                role,
                joined_at
            )
        `)
        .eq('organization_members.user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        throw new OperationError(
            `Failed to fetch user organizations: ${error.message}`,
            'database.fetch',
            { userId: user.id, errorCode: error.code }
        );
    }

    return organizations || [];
};

/**
 * Create a new organization
 * Database function handles creating the organization and adding the user as owner
 */
export const createOrganization = async (
    ctx: AuthenticatedContext,
    data: CreateOrganizationData
) => {
    const { supabase } = ctx;

    // Generate slug from name
    const slug = data.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // Validate slug
    if (!slug || slug.length < 3) {
        throw new OperationError(
            'Organization name must contain at least 3 alphanumeric characters',
            'validation'
        );
    }

    // Create organization using the RPC function
    const { data: orgId, error } = await supabase.rpc('create_organization_with_owner', {
        org_name: data.name.trim(),
        org_slug: slug,
        org_description: data.description?.trim() || undefined
    });

    if (error) {
        if (error.message?.includes('duplicate') || error.code === '23505') {
            throw new ConflictError(
                `An organization with this name already exists. Please choose a different name.`,
                'duplicate'
            );
        }
        throw new OperationError(
            `Failed to create organization: ${error.message}`,
            'database.insert',
            { errorCode: error.code }
        );
    }

    if (!orgId) {
        throw new OperationError(
            'Failed to create organization: No ID returned',
            'database.insert'
        );
    }

    return { id: orgId };
};

/**
 * Update an organization
 * RLS ensures only admins/owners can update
 */
export const updateOrganization = async (
    ctx: OrgContext,
    data: UpdateOrganizationData
) => {
    const { supabase, organizationId } = ctx;

    const { error } = await supabase
        .from('organizations')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

    if (error) {
        throw new OperationError(
            `Failed to update organization: ${error.message}`,
            'database.update',
            { orgId: organizationId, errorCode: error.code }
        );
    }

    return { success: true };
};

/**
 * Delete an organization
 * RLS ensures only owners can delete
 */
export const deleteOrganization = async (ctx: OrgContext) => {
    const { supabase, organizationId } = ctx;

    const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

    if (error) {
        throw new OperationError(
            `Failed to delete organization: ${error.message}`,
            'database.delete',
            { orgId: organizationId, errorCode: error.code }
        );
    }

    return { success: true };
}; 