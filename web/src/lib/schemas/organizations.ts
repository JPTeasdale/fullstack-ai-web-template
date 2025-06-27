import { z } from 'zod';

// Organization schemas
export const createOrganizationSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
	description: z.string().max(500, 'Description must be less than 500 characters').optional()
});

export const updateOrganizationSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	website_url: z.string().url('Must be a valid URL').optional().nullable(),
	logo_url: z.string().url('Must be a valid URL').optional().nullable()
});

// Member schemas
export const inviteMemberSchema = z.object({
	email: z.string().email('Must be a valid email address'),
	role: z.enum(['member', 'admin'])
});

export const updateMemberRoleSchema = z.object({
	role: z.enum(['member', 'admin', 'owner'])
});

// Type inference
export type CreateOrganizationData = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationData = z.infer<typeof updateOrganizationSchema>;
export type InviteMemberData = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleData = z.infer<typeof updateMemberRoleSchema>;
