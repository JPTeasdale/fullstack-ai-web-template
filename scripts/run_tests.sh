#!/bin/bash

# Run supabase tests with PostgreSQL notices suppressed
# This prevents cluttering the output with "relation already exists" messages

echo "Running Supabase database tests..."
PGOPTIONS='--client-min-messages=warning' supabase test db "$@" 