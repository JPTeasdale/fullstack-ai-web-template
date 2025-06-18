import { error } from '@sveltejs/kit';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { CLOUDFLARE_R2_ROOT_BUCKET_NAME } from '$env/static/private';
import { S3 } from '$lib/s3';
import { openai } from '$lib/gpt';
import { createFileUploadKey } from '$lib/fileUploads';
import type { ResponseInputItem } from 'openai/resources/responses/responses.mjs';
import type { Tables } from '$lib/types/supabase.types.js';
import { getOrgContext } from '$lib/llm/getOrgContext.js';

import analyzeDocumentContext from '$lib/context/analyze_document_context.txt?raw';
import { streamResponse } from '$lib/llm/streamResponse.js';
import toolAssignDocumentToProject from '$lib/llm/tools/assign_document_to_project.js';

async function getFileResponseBody(fileUpload: Tables<'file_uploads'>) {
	const key = createFileUploadKey(fileUpload);

	const command = new GetObjectCommand({
		Bucket: CLOUDFLARE_R2_ROOT_BUCKET_NAME,
		Key: key
	});
	const s3Response = await S3.send(command);

	return s3Response.Body;
}

export async function POST({ locals: { supabase }, params }) {
	const fileId = params.fileId;

	if (!fileId) {
		throw error(400, 'File ID is missing from the request');
	}

	// Fetch file info from supabase
	const { data: fileUpload, error: fileError } = await supabase
		.from('file_uploads')
		.select('*')
		.eq('id', fileId)
		.maybeSingle();

	if (fileError) {
		console.error('Supabase error fetching file upload:', fileError);
		throw error(500, 'Failed to retrieve file information');
	}

	if (!fileUpload) {
		throw error(404, 'File not found');
	}

	// Check if it's an image
	const isImage = fileUpload.content_type?.startsWith('image/');

	const orgContext = await getOrgContext(supabase);

	const input: ResponseInputItem[] = [
		{
			role: 'system',
			content: `${analyzeDocumentContext}${orgContext}`
		}
	];

	// Handle image files - convert to base64
	if (isImage) {
		const stream = await getFileResponseBody(fileUpload);
		if (!stream) {
			throw error(500, 'Failed to retrieve file');
		}
		const res = await stream.transformToByteArray();
		// Convert buffer to base64
		const base64 = Buffer.from(res).toString('base64');
		const mimeType = fileUpload.content_type || 'image/jpeg';

		input.push({
			role: 'user',
			content: [
				{
					type: 'input_image',
					image_url: `data:${mimeType};base64,${base64}`,
					detail: 'high'
				}
			]
		});
	} else if (fileUpload.openai_file_id) {
		input.push({
			role: 'user',
			content: [{ type: 'input_file', file_id: fileUpload.openai_file_id }]
		});
	} else {
		throw error(400, 'File is not an image or a supported file type');
	}

	const stream = await openai.responses.create({
		model: 'gpt-4o-mini',
		input,
		tools: [toolAssignDocumentToProject],
		tool_choice: 'auto',
		stream: true
	});

	return streamResponse(stream);
}
