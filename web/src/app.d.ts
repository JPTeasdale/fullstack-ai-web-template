// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/generated/supabase.types';
import type { PostHog } from 'posthog-node';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '$lib/types/generated/supabase.types'; // import generated types
import type Stripe from 'stripe';
import type { AppSupabaseClient } from '$lib/types/app.types';
import type OpenAI from 'openai';
import type { SESClient } from '@aws-sdk/client-ses';
import type { S3Client } from '@aws-sdk/client-s3';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: AppSupabaseClient;
			supabaseAdmin: AppSupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			posthog: PostHog;
			openai: OpenAI;
			ses: SESClient;
			r2: R2Bucket;
			trace: {
				distinctId: string;
				orgId: string;
			}
		}

		interface Platform {
			env: {
			  FILE_STORAGE: R2Bucket;
			};
		  }
		interface PageData {
			session: Session | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
	interface ResponseFunctionToolCall {
		meta: {
			call_from: 'server' | 'client';
			result?: any;
			error?: string;
		};
	}
}
export {};
