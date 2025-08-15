#!/bin/bash

# Gaming Rewards Protocol - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Gaming Rewards Protocol..."

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js version: $(node -v)"
}

# Check if Rust is installed
check_rust() {
    if ! command -v cargo &> /dev/null; then
        print_error "Rust is not installed. Please install Rust first."
        print_warning "Visit https://rustup.rs/ to install Rust"
        exit 1
    fi
    
    print_success "Rust version: $(cargo --version)"
}

# Check if Solana CLI is installed
check_solana() {
    if ! command -v solana &> /dev/null; then
        print_warning "Solana CLI is not installed. Installing..."
        sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
        export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    fi
    
    print_success "Solana CLI version: $(solana --version)"
}

# Check if Anchor CLI is installed
check_anchor() {
    if ! command -v anchor &> /dev/null; then
        print_warning "Anchor CLI is not installed. Installing..."
        cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
        avm install latest
        avm use latest
    fi
    
    print_success "Anchor CLI version: $(anchor --version)"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install core dependencies
    cd core
    npm install
    cd ..
    
    # Install validation dependencies
    cd validation
    npm install
    cd ..
    
    # Install interface dependencies
    cd interface
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Environment file created from template"
        print_warning "Please edit .env file with your API keys and configuration"
    else
        print_warning ".env file already exists"
    fi
}

# Build projects
build_projects() {
    print_status "Building projects..."
    
    # Build core
    cd core
    npm run build
    cd ..
    
    # Build validation
    cd validation
    npm run build
    cd ..
    
    # Build interface
    cd interface
    npm run build
    cd ..
    
    print_success "All projects built successfully"
}

# Run security audit
run_security_audit() {
    print_status "Running security audit..."
    
    npm run test:security
    
    print_success "Security audit completed"
}

# Setup Solana configuration
setup_solana() {
    print_status "Setting up Solana configuration..."
    
    # Set to devnet for development
    solana config set --url devnet
    
    # Create a new keypair if none exists
    if [ ! -f ~/.config/solana/id.json ]; then
        print_warning "No Solana keypair found. Creating new keypair..."
        solana-keygen new --no-bip39-passphrase
    fi
    
    print_success "Solana configuration completed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p test-results
    mkdir -p contracts/target
    
    print_success "Directories created"
}

# Main setup function
main() {
    print_status "Starting Gaming Rewards Protocol setup..."
    
    # Check prerequisites
    check_node
    check_rust
    check_solana
    check_anchor
    
    # Create directories
    create_directories
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_environment
    
    # Setup Solana
    setup_solana
    
    # Build projects
    build_projects
    
    # Run security audit
    run_security_audit
    
    print_success "🎉 Setup completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "  1. Edit .env file with your API keys"
    echo "  2. Get Steam API key from: https://steamcommunity.com/dev/apikey"
    echo "  3. Run 'npm run dev' to start development"
    echo "  4. Run 'npm test' to run tests"
    echo "  5. Run 'npm run deploy:devnet' to deploy to devnet"
    echo ""
    print_warning "Remember to never commit your .env file to version control!"
}

# Run main function
main "$@"
