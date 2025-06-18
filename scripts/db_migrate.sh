set -x
source "${0:A:h}/utils/env.sh"
check_env_vars SUPABASE_ACCESS_TOKEN

npx supabase migration up
