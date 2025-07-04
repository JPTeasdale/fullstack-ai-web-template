import { z } from 'zod';

export const aiFunctionCallResultSchema = z.object({
	callId: z.string(),
	result: z.string()
});

// File validation schemas
export const aiRequestSchema = z.object({
	prompt: z.string().optional(),
	previousResponseId: z.string().nullable(),
	fnCallResults: z.array(aiFunctionCallResultSchema).optional()
});
