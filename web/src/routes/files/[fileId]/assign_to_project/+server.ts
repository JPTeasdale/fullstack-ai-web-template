import { error, json } from '@sveltejs/kit';

import { openai } from '$lib/gpt';
import type { Tables } from '$lib/types/supabase.types.js';

export async function POST({ request, locals: { supabase, supabaseAdmin }, params }) {
	const file_id = params.fileId;
	const { project_id, date, document_type, name, summary } =
		(await request.json()) as Tables<'project_files'>;

	if (!file_id) {
		throw error(400, 'File ID is missing in the URL');
	}

	if (!project_id) {
		throw error(400, 'Project ID is missing from the request');
	}

	// Fetch file info from supabase
	const { data: fileUpload, error: fileError } = await supabase
		.from('file_uploads')
		.select('*')
		.eq('id', file_id)
		.maybeSingle();

	if (fileError) {
		console.error('Supabase error fetching file upload:', fileError);
		throw error(500, 'Failed to retrieve file information');
	}
	if (!fileUpload) {
		throw error(404, 'File not found');
	}

	if (!fileUpload.openai_file_id) {
		throw error(400, 'File is not uploaded to OpenAI');
	}

	const { error: projectFileError } = await supabase
		.from('project_files')
		.insert({
			project_id,
			file_id,
			date,
			document_type,
			name,
			summary
		})
		.maybeSingle();

	if (projectFileError) {
		console.error('Supabase error inserting file into project:', projectFileError);
		throw error(500, 'Failed to retrieve file information');
	}

	const { data: project, error: projectError } = await supabase
		.from('projects')
		.select('*')
		.eq('id', project_id)
		.maybeSingle();

	if (projectError) {
		console.error('Supabase error fetching project:', projectError);
		throw error(500, 'Failed to retrieve project information');
	}
	if (!project) {
		throw error(404, 'Project not found');
	}

	if (fileUpload.openai_file_id) {
		const vectorStoreId = project?.openai_vector_store_id;
		if (!vectorStoreId) {
			const newVectorStore = await openai.vectorStores.create({
				name: project.name,
				file_ids: [fileUpload.openai_file_id]
			});
			await supabaseAdmin
				.from('projects')
				.update({
					openai_vector_store_id: newVectorStore.id
				})
				.eq('id', project_id);
		} else {
			await openai.vectorStores.files.create(vectorStoreId, {
				file_id: fileUpload.openai_file_id
			});
		}
	}

	return json({
		success: true
	});
}
