#!/bin/zsh

# Environment variable utility functions with dotenv support

# Load environment variables from dotenv file
load_dotenv() {
    local dotenv_file=".envrc"
    
    if [[ -f "$dotenv_file" ]]; then
        echo "📄 Loading environment variables from $dotenv_file"
        set -a  # automatically export all variables
        source "$dotenv_file"
        set +a  # turn off automatic export
    else
        echo "⚠️  No dotenv file found ($dotenv_file)"
    fi
}

check_env_vars() {
    local missing_vars=()
    
    # Check each environment variable passed as arguments
    for var_name in "$@"; do
        # Use eval for more compatible indirect variable expansion
        local var_value
        eval "var_value=\$${var_name}"
        if [[ -z "$var_value" ]]; then
            missing_vars+=("$var_name")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        echo "❌ Error: Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "💡 Please ensure these variables are exported in your environment. You can use .zsh.env to load them automatically."
        return 1
    fi
    
    return 0
}

# Automatically load dotenv when this script is sourced
load_dotenv 