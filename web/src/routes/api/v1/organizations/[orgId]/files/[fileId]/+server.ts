import { error } from '@sveltejs/kit';
import { createFileUploadKey } from '$lib/utils/fileUpload';

export async function GET({ params, locals: { supabase, r2 } }) {
	const { fileId } = params;

	// Get file metadata
	const { data: file, error: fileError } = await supabase
		.from('files')
		.select('*')
		.eq('id', fileId)
		.single();

	if (fileError || !file) {
		throw error(404, 'File not found');
	}

	// Get file from R2
	const key = createFileUploadKey({
		id: file.id,
		organization_id: file.organization_id
	});

	const object = await r2.get(key);
	
	if (!object) {
		throw error(404, 'File data not found');
	}

	// Return file with appropriate headers
	return new Response(object.body, {
		headers: {
			'Content-Type': file.mime_type,
			'Content-Disposition': `attachment; filename="${file.name}"`,
			'Content-Length': file.size.toString()
		}
	});
}

export async function DELETE({ params, locals: { supabase, supabaseAdmin, r2, openai, user } }) {
	const { fileId, orgId } = params;

	if (!user) {
		throw error(401, 'Unauthorized');
	}

	// Get file metadata to ensure it belongs to the organization
	const { data: file, error: fileError } = await supabase
		.from('files')
		.select('*')
		.eq('id', fileId)
		.eq('organization_id', orgId)
		.single();

	if (fileError || !file) {
		throw error(404, 'File not found');
	}

	// Delete from R2
	const key = createFileUploadKey({
		id: file.id,
		organization_id: file.organization_id
	});

	try {
		await r2.delete(key);
	} catch (error) {
		console.error('Error deleting file from R2:', error);
	}

	// Delete from OpenAI if it was uploaded there
	if (file.openai_file_id) {
		try {
			await openai.files.delete(file.openai_file_id);
		} catch (error) {
			console.error('Error deleting file from OpenAI:', error);
		}
	}

	// Delete from database
	const { error: deleteError } = await supabaseAdmin
		.from('files')
		.delete()
		.eq('id', fileId);

	if (deleteError) {
		throw error(500, 'Failed to delete file');
	}

	return new Response(null, { status: 204 });
}
