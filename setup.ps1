# Gaming Rewards Protocol Bot - PowerShell Setup Script
# This script helps you set up the bot safely and securely on Windows

param(
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Help
)

# Show help if requested
if ($Help) {
    Write-Host "Gaming Rewards Protocol Bot - Setup Script" -ForegroundColor Cyan
    Write-Host "Usage: .\setup.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -SkipTests    Skip running tests" -ForegroundColor White
    Write-Host "  -SkipBuild    Skip building the project" -ForegroundColor White
    Write-Host "  -Help         Show this help message" -ForegroundColor White
    exit 0
}

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check Node.js version
function Test-NodeVersion {
    if (Test-Command "node") {
        $nodeVersion = node --version
        $majorVersion = $nodeVersion.Split('.')[0].TrimStart('v')
        if ([int]$majorVersion -ge 18) {
            Write-Success "Node.js version $nodeVersion is compatible"
        }
        else {
            Write-Error "Node.js version $nodeVersion is too old. Please install Node.js 18+"
            exit 1
        }
    }
    else {
        Write-Error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    }
}

# Function to check Git
function Test-Git {
    if (Test-Command "git") {
        $gitVersion = git --version
        Write-Success "Git is installed: $gitVersion"
    }
    else {
        Write-Error "Git is not installed. Please install Git first."
        exit 1
    }
}

# Function to check Solana CLI
function Test-SolanaCLI {
    if (Test-Command "solana") {
        $solanaVersion = solana --version
        Write-Success "Solana CLI is installed: $solanaVersion"
    }
    else {
        Write-Warning "Solana CLI is not installed. You can install it later if needed."
        Write-Status "Install with: sh -c `"`$(curl -sSfL https://release.solana.com/v1.17.0/install)`""
    }
}

# Function to check Docker (optional)
function Test-Docker {
    if (Test-Command "docker") {
        $dockerVersion = docker --version
        Write-Success "Docker is installed: $dockerVersion"
        
        if (Test-Command "docker-compose") {
            $composeVersion = docker-compose --version
            Write-Success "Docker Compose is installed: $composeVersion"
        }
        else {
            Write-Warning "Docker Compose is not installed. You can install it later if needed."
        }
    }
    else {
        Write-Warning "Docker is not installed. You can install it later if needed."
    }
}

# Function to install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    # Install root dependencies
    if (Test-Path "package.json") {
        npm ci
        Write-Success "Root dependencies installed"
    }
    
    # Install bot dependencies
    if (Test-Path "bots/package.json") {
        Push-Location bots
        npm ci
        Pop-Location
        Write-Success "Bot dependencies installed"
    }
}

# Function to setup environment
function Setup-Environment {
    Write-Status "Setting up environment..."
    
    if (-not (Test-Path ".env")) {
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env"
            Write-Success "Created .env file from template"
            Write-Warning "⚠️  IMPORTANT: Edit .env file with your actual values!"
            Write-Status "You can edit it now with: notepad .env"
        }
        else {
            Write-Error "env.example file not found!"
            exit 1
        }
    }
    else {
        Write-Warning ".env file already exists. Skipping creation."
    }
}

# Function to generate test keys
function Generate-TestKeys {
    Write-Status "Generating test keypairs..."
    
    # Create keys directory if it doesn't exist
    if (-not (Test-Path "keys")) {
        New-Item -ItemType Directory -Path "keys" | Out-Null
    }
    
    # Generate bot keypair
    if (-not (Test-Path "keys/bot-keypair.json")) {
        if (Test-Command "solana-keygen") {
            solana-keygen new --outfile keys/bot-keypair.json --no-bip39-passphrase
            Write-Success "Generated bot keypair: keys/bot-keypair.json"
        }
        else {
            Write-Warning "Solana CLI not available. Skipping keypair generation."
        }
    }
    else {
        Write-Warning "Bot keypair already exists. Skipping generation."
    }
    
    # Generate oracle keypair
    if (-not (Test-Path "keys/oracle-keypair.json")) {
        if (Test-Command "solana-keygen") {
            solana-keygen new --outfile keys/oracle-keypair.json --no-bip39-passphrase
            Write-Success "Generated oracle keypair: keys/oracle-keypair.json"
        }
        else {
            Write-Warning "Solana CLI not available. Skipping oracle keypair generation."
        }
    }
    else {
        Write-Warning "Oracle keypair already exists. Skipping generation."
    }
}

# Function to extract private keys
function Extract-PrivateKeys {
    Write-Status "Extracting private keys..."
    
    if (Test-Path "keys/bot-keypair.json") {
        $botKeypair = Get-Content "keys/bot-keypair.json" | ConvertFrom-Json
        $botPrivateKey = [Convert]::ToBase64String([byte[]]$botKeypair)
        Write-Success "Bot private key extracted"
        Write-Status "Add this to your .env file: BOT_PRIVATE_KEY=$botPrivateKey"
    }
    
    if (Test-Path "keys/oracle-keypair.json") {
        $oracleKeypair = Get-Content "keys/oracle-keypair.json" | ConvertFrom-Json
        $oraclePrivateKey = [Convert]::ToBase64String([byte[]]$oracleKeypair)
        Write-Success "Oracle private key extracted"
        Write-Status "Add this to your .env file: ORACLE_PRIVATE_KEY=$oraclePrivateKey"
    }
}

# Function to run tests
function Run-Tests {
    if (-not $SkipTests) {
        Write-Status "Running tests..."
        
        if (Test-Path "bots/package.json") {
            Push-Location bots
            npm test
            Pop-Location
            Write-Success "Tests completed successfully"
        }
        else {
            Write-Warning "No test configuration found. Skipping tests."
        }
    }
    else {
        Write-Warning "Skipping tests as requested."
    }
}

# Function to build project
function Build-Project {
    if (-not $SkipBuild) {
        Write-Status "Building project..."
        
        if (Test-Path "bots/package.json") {
            Push-Location bots
            npm run build
            Pop-Location
            Write-Success "Project built successfully"
        }
        else {
            Write-Warning "No build configuration found. Skipping build."
        }
    }
    else {
        Write-Warning "Skipping build as requested."
    }
}

# Function to show next steps
function Show-NextSteps {
    Write-Host ""
    Write-Success "🎉 Setup completed successfully!"
    Write-Host ""
    Write-Status "Next steps:"
    Write-Host "1. Edit your .env file with your actual values:"
    Write-Host "   notepad .env"
    Write-Host ""
    Write-Host "2. Get your Steam API key from:"
    Write-Host "   https://steamcommunity.com/dev/apikey"
    Write-Host ""
    Write-Host "3. Run the bot in development mode:"
    Write-Host "   cd bots && npm run dev"
    Write-Host ""
    Write-Host "4. Run tests:"
    Write-Host "   cd bots && npm test"
    Write-Host ""
    Write-Host "5. Build for production:"
    Write-Host "   cd bots && npm run build"
    Write-Host ""
    Write-Warning "⚠️  SECURITY REMINDERS:"
    Write-Host "- NEVER commit your .env file"
    Write-Host "- Keep your private keys secure"
    Write-Host "- Use different keys for devnet and mainnet"
    Write-Host "- Regularly update dependencies"
    Write-Host ""
    Write-Status "📚 Documentation:"
    Write-Host "- README.md - Getting started guide"
    Write-Host "- SECURITY.md - Security best practices"
    Write-Host "- CONTRIBUTING.md - How to contribute"
    Write-Host ""
}

# Main setup function
function Main {
    Write-Host "🚀 Gaming Rewards Protocol Bot - Setup Script" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check prerequisites
    Write-Status "Checking prerequisites..."
    Test-NodeVersion
    Test-Git
    Test-SolanaCLI
    Test-Docker
    
    # Install dependencies
    Install-Dependencies
    
    # Setup environment
    Setup-Environment
    
    # Generate test keys
    Generate-TestKeys
    
    # Extract private keys
    Extract-PrivateKeys
    
    # Build project
    Build-Project
    
    # Run tests
    Run-Tests
    
    # Show next steps
    Show-NextSteps
}

# Run main function
Main
