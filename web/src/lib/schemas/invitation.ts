import z from 'zod';

export const invitationActionSchema = z.object({
	invitationId: z.string()
});
