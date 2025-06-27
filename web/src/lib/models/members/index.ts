import { NotFoundError, OperationError, ConflictError } from "$lib/errors";
import type { OrgContext } from "$lib/models/context";
import type { Database } from "$lib/types/generated/supabase.types";

type MemberRole = Database['public']['Enums']['member_role'];

/**
 * Get all members of an organization
 * RLS ensures user can only see members of organizations they belong to
 */
export const getOrganizationMembers = async (ctx: OrgContext) => {
    const { supabase, organizationId } = ctx;

    const { data: members, error } = await supabase
        .from('organization_members')
        .select(`
            *,
            user_profiles!organization_members_user_id_fkey!inner(
                user_id,
                email,
                full_name,
                display_name,
                avatar_url
            )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new OperationError(
            `Failed to fetch members: ${error.message}`,
            'database.fetch',
            { orgId: organizationId, errorCode: error.code }
        );
    }

    return members || [];
};

/**
 * Get a specific member by ID
 */
export const getMember = async (ctx: OrgContext, memberId: string) => {
    const { supabase, organizationId } = ctx;

    const { data: member, error } = await supabase
        .from('organization_members')
        .select(`
            *,
            user_profiles!organization_members_user_id_fkey!inner(
                user_id,
                email,
                full_name,
                display_name,
                avatar_url
            )
        `)
        .eq('id', memberId)
        .eq('organization_id', organizationId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            throw new NotFoundError('Member');
        }
        throw new OperationError(
            `Failed to fetch member: ${error.message}`,
            'database.fetch',
            { memberId, orgId: organizationId, errorCode: error.code }
        );
    }

    return member;
};

/**
 * Update a member's role
 * RLS ensures only admins/owners can update roles
 */
export const updateMemberRole = async (
    ctx: OrgContext,
    memberId: string,
    newRole: MemberRole
) => {
    const { supabase, organizationId } = ctx;

    const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('organization_id', organizationId);

    if (error) {
        throw new OperationError(
            `Failed to update member role: ${error.message}`,
            'database.update',
            { memberId, orgId: organizationId, errorCode: error.code }
        );
    }

    return { success: true };
};

/**
 * Remove a member from an organization
 * RLS ensures only admins/owners can remove members
 */
export const removeMember = async (ctx: OrgContext, memberId: string) => {
    const { supabase, organizationId } = ctx;

    const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)
        .eq('organization_id', organizationId);

    if (error) {
        throw new OperationError(
            `Failed to remove member: ${error.message}`,
            'database.delete',
            { memberId, orgId: organizationId, errorCode: error.code }
        );
    }

    return { success: true };
};

/**
 * Add a member directly (without invitation)
 * RLS ensures only admins/owners can add members
 */
export const addMember = async (
    ctx: OrgContext,
    userId: string,
    role: MemberRole = 'member'
) => {
    const { supabase, organizationId, user } = ctx;

    // Check if user is already a member
    const { data: existing } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        throw new ConflictError(
            'User is already a member of this organization',
            'duplicate',
            existing
        );
    }

    // Add the member
    const { data: member, error } = await supabase
        .from('organization_members')
        .insert({
            organization_id: organizationId,
            user_id: userId,
            role,
            invited_by: user.id
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            throw new ConflictError(
                'User is already a member of this organization',
                'duplicate'
            );
        }
        throw new OperationError(
            `Failed to add member: ${error.message}`,
            'database.insert',
            { userId, orgId: organizationId, errorCode: error.code }
        );
    }

    return member;
}; 