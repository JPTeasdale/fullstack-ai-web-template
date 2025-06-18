#! /bin/zsh

# Source environment utilities (relative to script directory)
source "${0:A:h}/utils/env.sh"
check_env_vars SUPABASE_PROJECT_ID SUPABASE_ACCESS_TOKEN


echo "Initializing Supabase"

# Get the project name
PROJECT_NAME=$(npx supabase projects list --output json | jq -r ".[] | select(.id == \"$SUPABASE_PROJECT_ID\") | .name")

if [ -z "$PROJECT_NAME" ]; then
    echo "Error: Could not find project with ID: $SUPABASE_PROJECT_ID"
    exit 1
fi

echo "Project: $PROJECT_NAME (ID: $SUPABASE_PROJECT_ID)"
echo -n "Destructively push config to Supabase? (y/N): "
read -r CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

npx supabase config push --project-ref ${SUPABASE_PROJECT_ID}
npx supabase link --project-ref ${SUPABASE_PROJECT_ID}
npx supabase db push

echo "Done"
