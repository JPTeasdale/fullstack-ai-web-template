import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, user } }) => {
	if (!user) {
		return {
			files: []
		};
	}

	const { data: files, error } = await supabase
		.from('files')
		.select('*')
		.eq('organization_id', params.orgId)
		.eq('is_ready', true)
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching files:', error);
		return {
			files: []
		};
	}

	return {
		files: files || []
	};
};
