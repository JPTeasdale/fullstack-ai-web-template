import { json } from '@sveltejs/kit';
import { createFileUploadKey } from '$lib/utils/fileUpload';
import { getStreamFromFile, readIntoBuffer } from '$lib/cloudflare/getStreamFromFile';

export async function POST({
	request,
	locals: { supabase, supabaseAdmin, user, openai, r2 },
	params
}) {
	const { orgId } = params;

	if (!user) {
		return json(
			{ error: 'Unauthorized' },
			{
				status: 401
			}
		);
	}

	const { data: organization, error } = await supabase
		.from('organizations')
		.select('*')
		.eq('id', orgId)
		.maybeSingle();

	if (!organization) {
		return json({ error: 'Organization not found' }, { status: 404 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			return json(
				{ error: 'file is required in FormData' },
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
				organization_id: orgId,
				name: file.name,
				mime_type: contentType,
				is_public: false,
				size: file.size,
				user_id: user.id
			})
			.select('id,organization_id')
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

		const body = await getStreamFromFile(upload, file.size);

		const uploadPromise = r2.put(key, body);

		let openaiFileId: string | null = null;
		if (isDocument) {
			const openaiFile = await openai.files.create({
				purpose: 'user_data',
				file
			});

			openaiFileId = openaiFile.id;
		}

		await uploadPromise;

		if (openaiFileId) {
			if (!organization.openai_vector_store_id) {
				const store = await openai.vectorStores.create({
					name: organization.name,
					file_ids: [openaiFileId]
				});

				await supabase
					.from('organizations')
					.update({ openai_vector_store_id: store.id })
					.eq('id', orgId);
			} else if (openaiFileId) {
				await openai.vectorStores.files.create(organization.openai_vector_store_id, {
					file_id: openaiFileId
				});
			}
		}

		await supabaseAdmin
			.from('files')
			.update({
				is_ready: true,
				openai_file_id: openaiFileId
			})
			.eq('id', fileUpload.id)
			.single();

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
