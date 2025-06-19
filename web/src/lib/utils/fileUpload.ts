import type { Tables } from '$lib/types/generated/supabase.types';

type FileUploadKeyable = Pick<Tables<'files'>, 'organization_id' | 'id'>;

export function createFileUploadKey(fileUpload: FileUploadKeyable) {
	return `org/${fileUpload.organization_id}/file/${fileUpload.id}`;
}

export function parseFileUploadKey(key: string): FileUploadKeyable {
	const parts = key.split('/');
	const organization_id = parts[1];
	const id = parts[3];
	return { organization_id, id };
}
