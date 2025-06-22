import { createServerClient } from '@supabase/ssr';
import { error, fail, type Handle } from '@sveltejs/kit';
import { createClient as createAuthClient } from '@supabase/supabase-js';

import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

import type { Database } from '$lib/types/generated/supabase.types';

function createSupabaseAdminClient() {
	return createAuthClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

export const hookSupabaseSession: Handle = async ({ event, resolve }) => {
	/**
	 * Creates a Supabase client specific to this server request.
	 *
	 * The Supabase client gets the Auth token from the request cookies.
	 */
	const Authorization = event.request.headers.get('Authorization');
	if (Authorization) {
		if (!Authorization.startsWith('Bearer ')) {
			return error(401, 'Unauthorized');
		}
		event.locals.supabase = createAuthClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
			global: {
				headers: {
					Authorization
				}
			}
		});
	} else {
		event.locals.supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				/**
				 * SvelteKit's cookies API requires `path` to be explicitly set in
				 * the cookie options. Setting `path` to `/` replicates previous/
				 * standard behavior.
				 */
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		});
	}

	// This is vital for RLS to work correctly.
	// The database only are allows us to fetch data for the current organization.
	// If the user is not a member of the organization, or the organization does not exist
	// the value will be ignored and the user will not be able to access any organization data for this request.

	// It's also importat to set this in the hooks file, +layout.server.ts, and +page.server.ts files do
	// Not provide ordering guarantees, and this MUST be set before any database queries are made.
	if (event.params.orgId) {
		await event.locals.supabase.rpc('set_current_organization_id', { org_id: event.params.orgId });
	}

	event.locals.supabaseAdmin = createSupabaseAdminClient();

	/**
	 * Unlike `supabase.auth.getSession()`, which returns the session _without_
	 * validating the JWT, this function also calls `getUser()` to validate the
	 * JWT before returning the session.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation has failed
			return { session: null, user: null };
		}

		return { session, user };
	};

	const { session, user } = await event.locals.safeGetSession();

	event.locals.session = session;
	event.locals.user = user;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			/**
			 * Supabase libraries use the `content-range` and `x-supabase-api-version`
			 * headers, so we need to tell SvelteKit to pass it through.
			 */
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
