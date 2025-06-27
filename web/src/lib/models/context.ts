import type { AppSupabaseClient } from "$lib/types/app.types";
import type OpenAI from 'openai';

/**
 * Base context with essential services
 */
export interface BaseContext {
  supabase: AppSupabaseClient;
  openai: OpenAI;
  r2: R2Bucket;
}

/**
 * Context for authenticated requests
 */
export interface AuthenticatedContext extends BaseContext {
  supabaseAdmin: AppSupabaseClient;
  user: { id: string; email?: string };
}

/**
 * Context with organization scope
 * RLS will handle permissions based on the user's membership
 */
export interface OrgContext extends AuthenticatedContext {
  organizationId: string;
}

 