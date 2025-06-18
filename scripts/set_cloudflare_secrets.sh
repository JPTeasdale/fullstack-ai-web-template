#!/usr/bin/env zsh

set -euo pipefail

# Default environment
ENV="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Function to show usage
show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -e, --env ENVIRONMENT    Environment to initialize secrets for (development or production)
                            Default: production
    -h, --help              Show this help message

Examples:
    $0                      # Initialize secrets for production
    $0 --env development    # Initialize secrets for development
    $0 -e production        # Initialize secrets for production
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
            if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
                print_color $RED "❌ Error: Environment must be either 'development' or 'production'"
                exit 1
            fi
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_color $RED "❌ Error: Unknown option $1"
            show_help
            exit 1
            ;;
    esac
done

# Function to find all directories containing wrangler.jsonc files
find_wrangler_projects() {
    find . -name "wrangler.jsonc" -not -path "./node_modules/*" -exec dirname {} \; | sort
}

# Function to remove JSONC comments and parse with jq
parse_jsonc() {
    local file=$1
    
    # Remove JSONC comments
    sed -E 's|//.*$||g; s|/\*.*\*/||g' "$file" | \
    # Remove empty lines and clean up
    grep -v '^[[:space:]]*$' | \
    # Parse with jq
    jq -r '.secrets[]? | "\(.name)|\(.description)|\(.required // false)"' 2>/dev/null || {
        print_color $RED "❌ Error parsing JSONC file: $file"
        return 1
    }
}

# Function to prompt for secret with hidden input
prompt_for_secret() {
    local name=$1
    local description=$2
    local required=$3
    
    print_color $PURPLE "🔐 Configuring secret: $name"
    print_color $BLUE "📝 Hint: $description"
    
    echo -n "Enter secret value for $name: "
    read -rs secret_value
    echo  # New line after hidden input
    
    if [[ -z "$secret_value" && "$required" == "true" ]]; then
        print_color $RED "❌ Error: Secret $name is required but no value was provided"
        return 1
    fi
    
    echo "$secret_value"
}

# Function to set wrangler secret
set_wrangler_secret() {
    local name=$1
    local value=$2
    local project_dir=$3
    local env=$4
    
    local wrangler_args=("secret" "put" "$name")
    
    if [[ "$env" == "development" ]]; then
        wrangler_args+=("--env" "development")
    fi
    
    # Change to project directory and run wrangler
    (
        cd "$project_dir" || {
            print_color $RED "❌ Error: Cannot change to directory $project_dir"
            return 1
        }
        
        echo "$value" | wrangler "${wrangler_args[@]}" > /dev/null 2>&1 || {
            print_color $RED "❌ Error: Failed to set secret $name using wrangler"
            return 1
        }
        
        print_color $GREEN "✅ Secret $name has been set."
        echo "-----------------------------"
    )
}

# Function to load and validate secrets config
load_secrets_config() {
    local jsonc_path=$1
    
    if [[ ! -f "$jsonc_path" ]]; then
        return 1
    fi
    
    # Check if the file has a valid secrets array
    if ! parse_jsonc "$jsonc_path" | head -1 > /dev/null 2>&1; then
        print_color $YELLOW "⚠️  Invalid secrets configuration in $jsonc_path: missing or invalid 'secrets' array"
        return 1
    fi
    
    return 0
}

# Function to initialize secrets for a single project
initialize_project_secrets() {
    local project_dir=$1
    local env=$2
    local jsonc_path="$project_dir/wrangler_secrets.jsonc"
    
    if ! load_secrets_config "$jsonc_path"; then
        local relative_path=$(realpath --relative-to="$(pwd)" "$jsonc_path" 2>/dev/null || echo "$jsonc_path")
        print_color $CYAN "⏭️  No secrets configuration found at $relative_path"
        return 0
    fi
    
    local project_name=$(realpath --relative-to="$(pwd)" "$project_dir" 2>/dev/null || basename "$project_dir")
    print_color $GREEN "\n🚀 Initializing secrets for project: $project_name"
    print_color $BLUE "📁 Project directory: $project_dir"
    print_color $BLUE "📄 Configuration: $(realpath --relative-to="$(pwd)" "$jsonc_path" 2>/dev/null || echo "$jsonc_path")"
    echo "$(printf '─%.0s' {1..50})"
    
    # Parse secrets configuration
    while IFS='|' read -r name description required; do
        if [[ -n "$name" ]]; then
            local secret_value
            secret_value=$(prompt_for_secret "$name" "$description" "$required") || {
                print_color $RED "❌ Error setting secret $name"
                return 1
            }
            
            if [[ -n "$secret_value" ]]; then
                set_wrangler_secret "$name" "$secret_value" "$project_dir" "$env" || {
                    print_color $RED "❌ Error setting secret $name"
                    return 1
                }
            else
                print_color $CYAN "⏭️  Skipping optional secret: $name"
                echo "-----------------------------"
            fi
        fi
    done < <(parse_jsonc "$jsonc_path")
    
    print_color $GREEN "🎉 All secrets for $project_name have been initialized!"
}

# Main function
main() {
    print_color $CYAN "🔍 Discovering Cloudflare projects for $ENV environment...\n"
    
    # Find all wrangler projects
    local project_dirs=()
    while IFS= read -r -d '' dir; do
        project_dirs+=("$dir")
    done < <(find_wrangler_projects | tr '\n' '\0')
    
    if [[ ${#project_dirs[@]} -eq 0 ]]; then
        print_color $RED "❌ No projects with wrangler.jsonc found."
        return 1
    fi
    
    print_color $BLUE "📦 Found ${#project_dirs[@]} project(s):"
    
    local projects_with_secrets=()
    for dir in "${project_dirs[@]}"; do
        local relative_path=$(realpath --relative-to="$(pwd)" "$dir" 2>/dev/null || basename "$dir")
        local secrets_file="$dir/wrangler_secrets.jsonc"
        
        if [[ -f "$secrets_file" ]]; then
            print_color $GREEN "  - $relative_path ✅ wrangler_secrets.jsonc"
            projects_with_secrets+=("$dir")
        else
            print_color $YELLOW "  - $relative_path ❌ wrangler_secrets.jsonc"
        fi
    done
    
    if [[ ${#projects_with_secrets[@]} -eq 0 ]]; then
        print_color $RED "\n❌ No projects with wrangler_secrets.jsonc found."
        print_color $BLUE "💡 Create a wrangler_secrets.jsonc file in your project directories to define secrets."
        return 1
    fi
    
    print_color $CYAN "\n🎯 Processing ${#projects_with_secrets[@]} project(s) with secret configurations..."
    
    for project_dir in "${projects_with_secrets[@]}"; do
        initialize_project_secrets "$project_dir" "$ENV" || {
            print_color $RED "❌ Failed to initialize secrets for project in $project_dir"
            return 1
        }
    done
    
    print_color $GREEN "\n🎊 All project secrets for $ENV environment have been initialized successfully!"
}

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    if ! command -v wrangler >/dev/null 2>&1; then
        missing_deps+=("wrangler")
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        missing_deps+=("jq")
    fi
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        print_color $RED "❌ Missing required dependencies: ${missing_deps[*]}"
        print_color $BLUE "Please install the missing dependencies and try again."
        print_color $BLUE "  - wrangler: npm install -g wrangler"
        print_color $BLUE "  - jq: brew install jq (macOS) or apt-get install jq (Ubuntu)"
        exit 1
    fi
}

# Run the script
check_dependencies
main || {
    print_color $RED "❌ Failed to initialize secrets"
    exit 1
} 