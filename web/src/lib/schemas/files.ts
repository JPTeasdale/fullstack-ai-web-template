import { z } from 'zod';

// File validation schemas
export const fileUploadSchema = z.object({
  maxSize: z.number().default(50 * 1024 * 1024), // 50MB default
  allowedTypes: z.array(z.string()).default([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ])
});

export const fileMetadataSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional()
});

// File type helpers
export const FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as string[],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ] as string[]
} as const;

export function isImageFile(mimeType: string): boolean {
  return FILE_TYPES.images.includes(mimeType);
}

export function isDocumentFile(mimeType: string): boolean {
  return FILE_TYPES.documents.includes(mimeType);
}

// Type inference
export type FileUploadConfig = z.infer<typeof fileUploadSchema>;
export type FileMetadata = z.infer<typeof fileMetadataSchema>; 