# Gaming Rewards Protocol - Windows Setup Script
# This script sets up the development environment on Windows

param(
    [switch]$SkipDependencies,
    [switch]$SkipTests,
    [switch]$Verbose
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

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

function Install-NodeDependencies {
    Write-ColorOutput "Installing Node.js dependencies..." $Blue
    
    # Install root dependencies
    if (Test-Path "package.json") {
        Write-ColorOutput "Installing root dependencies..." $Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to install root dependencies" $Red
            exit 1
        }
    }
    
    # Install bot dependencies
    if (Test-Path "bots/package.json") {
        Write-ColorOutput "Installing bot dependencies..." $Yellow
        Set-Location "bots"
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to install bot dependencies" $Red
            exit 1
        }
        Set-Location ".."
    }
    
    Write-ColorOutput "Node.js dependencies installed successfully" $Green
}

function Install-RustDependencies {
    Write-ColorOutput "Installing Rust dependencies..." $Blue
    
    if (Test-Path "contracts/Cargo.toml") {
        Set-Location "contracts"
        
        # Check if Rust is installed
        if (-not (Test-Command "cargo")) {
            Write-ColorOutput "Rust not found. Please install Rust from https://rustup.rs/" $Red
            exit 1
        }
        
        # Fetch dependencies
        Write-ColorOutput "Fetching Rust dependencies..." $Yellow
        cargo fetch
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to fetch Rust dependencies" $Red
            exit 1
        }
        
        Set-Location ".."
    }
    
    Write-ColorOutput "Rust dependencies installed successfully" $Green
}

function Install-Anchor {
    Write-ColorOutput "Installing Anchor..." $Blue
    
    if (-not (Test-Command "anchor")) {
        Write-ColorOutput "Installing Anchor CLI..." $Yellow
        
        # Install Anchor using cargo
        cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to install Anchor" $Red
            exit 1
        }
        
        # Install latest Anchor version
        avm install latest
        avm use latest
        
        Write-ColorOutput "Anchor installed successfully" $Green
    } else {
        Write-ColorOutput "Anchor already installed" $Green
    }
}

function Install-SolanaCLI {
    Write-ColorOutput "Installing Solana CLI..." $Blue
    
    if (-not (Test-Command "solana")) {
        Write-ColorOutput "Installing Solana CLI..." $Yellow
        
        # Download and install Solana CLI
        $solanaInstaller = "solana-install-init-x86_64-pc-windows-msvc.exe"
        $solanaUrl = "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe"
        
        Invoke-WebRequest -Uri $solanaUrl -OutFile $solanaInstaller
        Start-Process -FilePath $solanaInstaller -ArgumentList "--" -Wait
        
        # Clean up installer
        Remove-Item $solanaInstaller
        
        # Add Solana to PATH
        $env:PATH += ";$env:USERPROFILE\.local\share\solana\install\active_release\bin"
        
        Write-ColorOutput "Solana CLI installed successfully" $Green
    } else {
        Write-ColorOutput "Solana CLI already installed" $Green
    }
}

function Build-Project {
    Write-ColorOutput "Building project..." $Blue
    
    # Build smart contracts
    if (Test-Path "contracts") {
        Write-ColorOutput "Building smart contracts..." $Yellow
        Set-Location "contracts"
        anchor build
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to build smart contracts" $Red
            exit 1
        }
        Set-Location ".."
    }
    
    # Build bot
    if (Test-Path "bots") {
        Write-ColorOutput "Building bot..." $Yellow
        Set-Location "bots"
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Failed to build bot" $Red
            exit 1
        }
        Set-Location ".."
    }
    
    Write-ColorOutput "Project built successfully" $Green
}

function Test-Project {
    Write-ColorOutput "Running tests..." $Blue
    
    # Run smart contract tests
    if (Test-Path "contracts" -and -not $SkipTests) {
        Write-ColorOutput "Running smart contract tests..." $Yellow
        Set-Location "contracts"
        anchor test --skip-lint
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Smart contract tests failed" $Red
            exit 1
        }
        Set-Location ".."
    }
    
    # Run bot tests
    if (Test-Path "bots" -and -not $SkipTests) {
        Write-ColorOutput "Running bot tests..." $Yellow
        Set-Location "bots"
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput "Bot tests failed" $Red
            exit 1
        }
        Set-Location ".."
    }
    
    Write-ColorOutput "All tests passed" $Green
}

function Setup-Environment {
    Write-ColorOutput "Setting up environment..." $Blue
    
    # Create .env file if it doesn't exist
    if (-not (Test-Path ".env")) {
        Write-ColorOutput "Creating .env file from template..." $Yellow
        Copy-Item "env.example" ".env"
        Write-ColorOutput "Please update .env file with your configuration" $Yellow
    }
    
    # Create necessary directories
    $directories = @("logs", "test-results", "audit")
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-ColorOutput "Created directory: $dir" $Green
        }
    }
    
    Write-ColorOutput "Environment setup completed" $Green
}

function Show-SetupComplete {
    Write-ColorOutput "`n==========================================" $Blue
    Write-ColorOutput "SETUP COMPLETED SUCCESSFULLY!" $Green
    Write-ColorOutput "==========================================" $Blue
    Write-ColorOutput "`nNext steps:" $Yellow
    Write-ColorOutput "1. Update .env file with your configuration" $White
    Write-ColorOutput "2. Replace placeholder addresses in constants.rs" $White
    Write-ColorOutput "3. Set up your Solana wallet and fund it" $White
    Write-ColorOutput "4. Deploy smart contracts: npm run deploy:devnet" $White
    Write-ColorOutput "5. Start the bot: npm run bot" $White
    Write-ColorOutput "`nFor more information, see README.md" $Blue
}

# Main setup process
try {
    Write-ColorOutput "Starting Gaming Rewards Protocol setup..." $Blue
    
    # Check prerequisites
    Write-ColorOutput "Checking prerequisites..." $Blue
    
    if (-not (Test-Command "node")) {
        Write-ColorOutput "Node.js not found. Please install Node.js 18+ from https://nodejs.org/" $Red
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-ColorOutput "npm not found. Please install npm" $Red
        exit 1
    }
    
    Write-ColorOutput "Prerequisites check passed" $Green
    
    # Install dependencies
    if (-not $SkipDependencies) {
        Install-NodeDependencies
        Install-RustDependencies
        Install-Anchor
        Install-SolanaCLI
    }
    
    # Setup environment
    Setup-Environment
    
    # Build project
    Build-Project
    
    # Run tests
    Test-Project
    
    # Show completion message
    Show-SetupComplete
    
} catch {
    Write-ColorOutput "Setup failed: $($_.Exception.Message)" $Red
    exit 1
}
