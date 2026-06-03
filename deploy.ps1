# ===========================================================
# APDS v3 - Auto Deployment Script (Windows EC2)
# Chauke Ndlovu International Bank - Employee Payments Portal
# ===========================================================
# Run: Set-ExecutionPolicy Bypass -Scope Process -Force; .\deploy.ps1
# ===========================================================

$ErrorActionPreference = "Stop"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  APDS v3 - Automated Deployment (Windows EC2)" -ForegroundColor Cyan
Write-Host "  Chauke Ndlovu International Bank" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# --- CHECK PREREQUISITES ---
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeFound = $false
try {
    $nodeVer = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Node.js: $nodeVer" -ForegroundColor Green
        $nodeFound = $true
    }
} catch {}

if (-not $nodeFound) {
    Write-Host "  Node.js not found. Installing..." -ForegroundColor Red
    $nodeInstaller = "$env:TEMP\node-setup.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.20.3/node-v18.20.3-x64.msi" -OutFile $nodeInstaller
    Start-Process msiexec.exe -Wait -ArgumentList "/i $nodeInstaller /quiet"
    $env:Path += ";C:\Program Files\nodejs"
    Write-Host "  Node.js installed" -ForegroundColor Green
}

# Check MongoDB
$mongoRunning = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
if (-not $mongoRunning) {
    Write-Host "  MongoDB service not found - ensure MONGO_URI in .env points to a running instance" -ForegroundColor Yellow
} else {
    Write-Host "  MongoDB: Running" -ForegroundColor Green
}

# Check OpenSSL
$sslFound = $false
try {
    $sslVer = openssl version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OpenSSL: $sslVer" -ForegroundColor Green
        $sslFound = $true
    }
} catch {}

if (-not $sslFound) {
    Write-Host "  OpenSSL not found. Attempting install..." -ForegroundColor Red
    try {
        winget install --id ShiningLight.OpenSSL -e --accept-source-agreements --accept-package-agreements 2>$null
        $env:Path += ";C:\Program Files\OpenSSL-Win64\bin"
        Write-Host "  OpenSSL installed" -ForegroundColor Green
    } catch {
        Write-Host "  Could not auto-install OpenSSL. Download from: https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Red
    }
}

Write-Host ""

# --- NAVIGATE TO SCRIPT DIRECTORY ---
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# --- BACKEND SETUP ---
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install

# Generate SSL keys if not present
if ((-not (Test-Path "keys\server.key")) -or (-not (Test-Path "keys\server.cert"))) {
    Write-Host "Generating SSL certificate..." -ForegroundColor Yellow
    node generate-keys.js

    Write-Host "Importing certificate into Windows Trusted Root Store..." -ForegroundColor Yellow
    try {
        Import-Certificate -FilePath "keys\server.cert" -CertStoreLocation Cert:\LocalMachine\Root | Out-Null
        Write-Host "  Certificate trusted by Windows" -ForegroundColor Green
    } catch {
        Write-Host "  Could not import cert (run as Administrator for auto-trust)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  SSL keys already exist - skipping" -ForegroundColor Green
}

# Create .env if not present
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "  IMPORTANT: Edit backend\.env with your MongoDB URI and JWT secret!" -ForegroundColor Red
}

# Seed database
Write-Host "Seeding database with pre-configured users..." -ForegroundColor Yellow
node seed.js

Write-Host ""
Write-Host "Backend ready" -ForegroundColor Green
Write-Host ""

# --- FRONTEND SETUP ---
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install

Write-Host "Building React frontend..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Frontend built" -ForegroundColor Green
Write-Host ""

# --- FIREWALL RULES ---
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "APDS v3 - HTTPS (3001)" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  Port 3001 opened in firewall" -ForegroundColor Green
} catch {
    Write-Host "  Firewall rule may already exist" -ForegroundColor Yellow
}
Write-Host ""

# --- START SERVER ---
Set-Location ..\backend

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  Starting HTTPS server..." -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  URL: https://localhost:3001" -ForegroundColor White
Write-Host "  EC2: https://<YOUR-EC2-PUBLIC-IP>:3001" -ForegroundColor White
Write-Host ""
Write-Host "  Login Credentials:" -ForegroundColor White
Write-Host "  ---------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  EMPLOYEE: Lindiwe | Account: 1054083600 | Pass: Lindiwe@0701" -ForegroundColor White
Write-Host "  CUSTOMER: JohnN   | Account: 2067891234 | Pass: John@2024!" -ForegroundColor White
Write-Host "  CUSTOMER: SarahM  | Account: 3078901234 | Pass: Sarah@2024!" -ForegroundColor White
Write-Host "  ---------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

node server.js
