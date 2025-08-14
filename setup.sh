#!/bin/bash

# Gaming Rewards Protocol Bot - Setup Script
# This script helps you set up the bot safely and securely

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js version $(node --version) is compatible"
        else
            print_error "Node.js version $(node --version) is too old. Please install Node.js 18+"
            exit 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
}

# Function to check Solana CLI
check_solana_cli() {
    if command_exists solana; then
        print_success "Solana CLI is installed: $(solana --version)"
    else
        print_warning "Solana CLI is not installed. You can install it later if needed."
        print_status "Install with: sh -c \"\$(curl -sSfL https://release.solana.com/v1.17.0/install)\""
    fi
}

# Function to check Git
check_git() {
    if command_exists git; then
        print_success "Git is installed: $(git --version)"
    else
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
}

# Function to check Docker (optional)
check_docker() {
    if command_exists docker; then
        print_success "Docker is installed: $(docker --version)"
        if command_exists docker-compose; then
            print_success "Docker Compose is installed: $(docker-compose --version)"
        else
            print_warning "Docker Compose is not installed. You can install it later if needed."
        fi
    else
        print_warning "Docker is not installed. You can install it later if needed."
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ -f "package.json" ]; then
        npm ci
        print_success "Root dependencies installed"
    fi
    
    # Install bot dependencies
    if [ -f "bots/package.json" ]; then
        cd bots
        npm ci
        cd ..
        print_success "Bot dependencies installed"
    fi
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            print_success "Created .env file from template"
            print_warning "⚠️  IMPORTANT: Edit .env file with your actual values!"
            print_status "You can edit it now with: nano .env"
        else
            print_error "env.example file not found!"
            exit 1
        fi
    else
        print_warning ".env file already exists. Skipping creation."
    fi
}

# Function to generate test keys
generate_test_keys() {
    print_status "Generating test keypairs..."
    
    # Create keys directory if it doesn't exist
    mkdir -p keys
    
    # Generate bot keypair
    if [ ! -f "keys/bot-keypair.json" ]; then
        if command_exists solana-keygen; then
            solana-keygen new --outfile keys/bot-keypair.json --no-bip39-passphrase
            print_success "Generated bot keypair: keys/bot-keypair.json"
        else
            print_warning "Solana CLI not available. Skipping keypair generation."
        fi
    else
        print_warning "Bot keypair already exists. Skipping generation."
    fi
    
    # Generate oracle keypair
    if [ ! -f "keys/oracle-keypair.json" ]; then
        if command_exists solana-keygen; then
            solana-keygen new --outfile keys/oracle-keypair.json --no-bip39-passphrase
            print_success "Generated oracle keypair: keys/oracle-keypair.json"
        else
            print_warning "Solana CLI not available. Skipping oracle keypair generation."
        fi
    else
        print_warning "Oracle keypair already exists. Skipping generation."
    fi
}

# Function to extract private keys
extract_private_keys() {
    print_status "Extracting private keys..."
    
    if [ -f "keys/bot-keypair.json" ]; then
        BOT_PRIVATE_KEY=$(node -e "const fs = require('fs'); const keypair = JSON.parse(fs.readFileSync('keys/bot-keypair.json')); console.log(Buffer.from(keypair).toString('base58'))")
        print_success "Bot private key extracted"
        print_status "Add this to your .env file: BOT_PRIVATE_KEY=$BOT_PRIVATE_KEY"
    fi
    
    if [ -f "keys/oracle-keypair.json" ]; then
        ORACLE_PRIVATE_KEY=$(node -e "const fs = require('fs'); const keypair = JSON.parse(fs.readFileSync('keys/oracle-keypair.json')); console.log(Buffer.from(keypair).toString('base58'))")
        print_success "Oracle private key extracted"
        print_status "Add this to your .env file: ORACLE_PRIVATE_KEY=$ORACLE_PRIVATE_KEY"
    fi
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    if [ -f "bots/package.json" ]; then
        cd bots
        npm test
        cd ..
        print_success "Tests completed successfully"
    else
        print_warning "No test configuration found. Skipping tests."
    fi
}

# Function to build project
build_project() {
    print_status "Building project..."
    
    if [ -f "bots/package.json" ]; then
        cd bots
        npm run build
        cd ..
        print_success "Project built successfully"
    else
        print_warning "No build configuration found. Skipping build."
    fi
}

# Function to show next steps
show_next_steps() {
    echo
    print_success "🎉 Setup completed successfully!"
    echo
    print_status "Next steps:"
    echo "1. Edit your .env file with your actual values:"
    echo "   nano .env"
    echo
    echo "2. Get your Steam API key from:"
    echo "   https://steamcommunity.com/dev/apikey"
    echo
    echo "3. Run the bot in development mode:"
    echo "   cd bots && npm run dev"
    echo
    echo "4. Run tests:"
    echo "   cd bots && npm test"
    echo
    echo "5. Build for production:"
    echo "   cd bots && npm run build"
    echo
    print_warning "⚠️  SECURITY REMINDERS:"
    echo "- NEVER commit your .env file"
    echo "- Keep your private keys secure"
    echo "- Use different keys for devnet and mainnet"
    echo "- Regularly update dependencies"
    echo
    print_status "📚 Documentation:"
    echo "- README.md - Getting started guide"
    echo "- SECURITY.md - Security best practices"
    echo "- CONTRIBUTING.md - How to contribute"
    echo
}

# Main setup function
main() {
    echo "🚀 Gaming Rewards Protocol Bot - Setup Script"
    echo "=============================================="
    echo
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    check_node_version
    check_git
    check_solana_cli
    check_docker
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_environment
    
    # Generate test keys
    generate_test_keys
    
    # Extract private keys
    extract_private_keys
    
    # Build project
    build_project
    
    # Run tests
    run_tests
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@"
