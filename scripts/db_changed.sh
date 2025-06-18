#! /bin/zsh

# Source environment utilities (relative to script directory)
source "${0:A:h}/utils/env.sh"
check_env_vars SUPABASE_PROJECT_ID SUPABASE_ACCESS_TOKEN SUPABASE_AUTH_HOOK_SECRET

SUPABASE_CONNECTION_STRING="postgresql://postgres.${SUPABASE_PROJECT_ID}:${SUPABASE_DB_PASSWORD}@${SUPABASE_REGION}.pooler.supabase.com:5432/postgres"

npx supabase gen types typescript --project-id ${SUPABASE_PROJECT_ID} > web/src/lib/types/generated/supabase.types.ts
npx supabase db dump --db-url "$SUPABASE_CONNECTION_STRING" --schema public -f supabase/schema.sql
