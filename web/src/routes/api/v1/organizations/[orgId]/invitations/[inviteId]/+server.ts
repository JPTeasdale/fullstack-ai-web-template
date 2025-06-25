import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals: { supabase }, params }) => {
	const { inviteId } = params;

    const { data: invitation, error } = await supabase.from('invitations').delete().eq('id', inviteId);
    console.log({invitation})

    if (error) {
        return json({ error: error.message }, { status: 500 });
    }

	return json({ success: true, invitation });
}; 

