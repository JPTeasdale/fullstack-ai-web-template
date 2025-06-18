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

import { Readable } from 'node:stream';

export function webReadableStreamToNodeReadable(webStream: ReadableStream): Readable {
  const reader = webStream.getReader();
  return new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
      } else {
        this.push(Buffer.from(value));
      }
    }
  });
}