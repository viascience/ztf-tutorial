#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
log() {
    echo -e "${2:-$NC}$1${NC}"
}

# Check if Supabase CLI is installed
check_supabase_cli() {
    # Check global installation first
    if command -v supabase &> /dev/null; then
        return 0
    fi
    
    # Check local installation via npx
    if npx supabase --version &> /dev/null; then
        return 0
    fi
    
    # Check if it's installed as dev dependency
    if [ -f "node_modules/.bin/supabase" ]; then
        return 0
    fi
    
    log "❌ Supabase CLI is not installed." $RED
    log "   Or add to project: npm install supabase --save-dev" $CYAN
    log "   Or use: npx supabase --help" $CYAN
    return 1
}

# Check if Docker is running
check_docker() {
    if ! docker info &> /dev/null; then
        log "❌ Docker is not running. Please start Docker Desktop." $RED
        return 1
    fi
    return 0
}

# Check if Supabase is running
check_supabase_status() {
    # Try to get Supabase status
    if npx supabase status &> /dev/null; then
        log "✅ Supabase is running!" $GREEN
        log "     Dashboard: http://localhost:54323" $CYAN
        log "    API: http://localhost:54321" $CYAN
        return 0
    else
        log "  Supabase is not running" $YELLOW
        return 1
    fi
}

# Start Supabase
start_supabase() {
    log "🚀 Starting Supabase services..." $BLUE
    
    # Check if supabase is initialized
    if [ ! -f "supabase/config.toml" ]; then
        log "Initializing Supabase project..." $YELLOW
        npx supabase init
    fi
    
    log "Starting Supabase stack (this may take a minute)..." $YELLOW
    if npx supabase start; then
        log "✅ Supabase is now running!" $GREEN
        log "     Dashboard: http://localhost:54323" $CYAN
        log "    API: http://localhost:54321" $CYAN
        log "" 
        log "Copy the anon key and service_role key from above into your .env.local file" $YELLOW
        return 0
    else
        log "❌ Failed to start Supabase" $RED
        return 1
    fi
}

# Main function
main() {
    log " Checking Supabase development environment..." $BLUE
    
    # Check prerequisites
    if ! check_docker; then
        exit 1
    fi
    
    if ! check_supabase_cli; then
        exit 1
    fi
    
    # Check if Supabase is running
    if ! check_supabase_status; then
        if ! start_supabase; then
            log "" 
            log "   Troubleshooting steps:" $YELLOW
            log "   1. Make sure Docker Desktop is running" $CYAN
            log "   2. Try: npx supabase stop && npx supabase start" $CYAN
            log "   3. Check logs: npx supabase logs" $CYAN
            exit 1
        fi
    fi
    
    log "🎉 Development environment ready!" $GREEN
    log "   Next.js will start shortly..." $CYAN
}

# Run main function
main "$@"