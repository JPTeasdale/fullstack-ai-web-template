import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './generated/supabase.types';

export type AppSupabaseClient = SupabaseClient<Database>;
