import { json } from '@sveltejs/kit';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { CLOUDFLARE_R2_ROOT_BUCKET_NAME } from '$env/static/private';
import { createFileUploadKey } from '$lib/utils/fileUpload';
import { webReadableStreamToNodeReadable } from '$lib/stream.js';

export async function POST({ request, locals: { supabase, supabaseAdmin, user, openai, s3 } }) {
	try {
		const formData = await request.formData();
		const orgId = formData.get('orgId') as string | null;
		const file = formData.get('file') as File | null;

		if (!orgId || !file) {
			return json(
				{ error: 'orgId and file are required in FormData' },
				{
					status: 400
				}
			);
		}

		const contentType = file.type;
		if (!contentType) {
			return json(
				{ error: 'File contentType could not be determined' },
				{
					status: 400
				}
			);
		}
		const isImage = contentType.startsWith('image/');
		const isDocument = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'text/plain'
		].includes(contentType);

		if (!isImage && !isDocument) {
			return json(
				{
					error: 'Unsupported file type. Please upload an image or document.'
				},
				{
					status: 400
				}
			);
		}

		const { data: fileUpload, error: fileUploadError } = await supabase
			.from('files')
			.insert({
				org_id: orgId,
				uploaded_by: user?.id,
				filename: file.name,
				content_type: contentType
			})
			.select('id,org_id')
			.single();

		if (fileUploadError || !fileUpload) {
			console.error('Supabase files insert error:', fileUploadError);
			return json(
				{ error: 'Failed to create file upload record' },
				{
					status: 500
				}
			);
		}

		const [_, upload] = file.stream().tee();

		const key = createFileUploadKey(fileUpload);

		const command = new PutObjectCommand({
			Bucket: CLOUDFLARE_R2_ROOT_BUCKET_NAME,
			Key: key,
			ContentType: contentType,
			Body: webReadableStreamToNodeReadable(upload),
			ContentLength: file.size,
			ACL: 'private'
		});

		const s3UplaodPromise = s3.send(command);

		if (isDocument) {
			const openaiFile = await openai.files.create({
				purpose: 'user_data',
				file
			});

			await supabaseAdmin
				.from('files')
				.update({
					openai_file_id: openaiFile.id
				})
				.eq('id', fileUpload.id)
				.single();
		}

		await s3UplaodPromise;

		return json({
			fileId: fileUpload.id
		});
	} catch (error) {
		console.error('Error processing file upload:', error);
		return json(
			{ error: 'Failed to process file upload' },
			{
				status: 500
			}
		);
	}
}
