# Step-by-Step Deployment Guide (Windows EC2)

## APDS v3 — Chauke Ndlovu International Bank Employee Payments Portal

---

## Option A: Automatic Deployment (Recommended)

Open PowerShell as Administrator on your EC2 instance:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\deploy.ps1
```

This handles everything: installs Node/OpenSSL if missing, generates SSL cert, imports it into Windows trust store, seeds DB, builds frontend, opens firewall, and starts the server.

---

## Option B: Manual Step-by-Step Deployment

### Step 1: Connect to EC2

1. Go to AWS Console → EC2 → select your Windows instance
2. Click "Connect" → "RDP Client"
3. Download the RDP file and connect using your key pair password

### Step 2: Install Prerequisites

**Node.js 18+:**
- Download from https://nodejs.org/dist/v18.20.3/node-v18.20.3-x64.msi
- Run the installer, accept defaults
- Verify: `node --version` in PowerShell

**MongoDB:**
- Download from https://www.mongodb.com/try/download/community (Windows MSI)
- Install as a Windows Service (default option)
- Or use MongoDB Atlas (cloud) — no local install needed

**OpenSSL:**
- Download from https://slproweb.com/products/Win32OpenSSL.html (Win64 Full)
- Install to `C:\Program Files\OpenSSL-Win64`
- Add to PATH: `$env:Path += ";C:\Program Files\OpenSSL-Win64\bin"`

**Git (optional, for CircleCI):**
- Download from https://git-scm.com/download/win

### Step 3: Transfer Project Files

Option 1 — Git clone:
```powershell
git clone https://github.com/YOUR_USERNAME/APDS-v3.git
cd APDS-v3
```

Option 2 — Upload ZIP via RDP (drag and drop into the RDP window)

### Step 4: Configure Environment Variables

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
```

Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/apds_v3
JWT_SECRET=YourSuperSecretKeyAtLeast32Characters!@#
PORT=3001
FRONTEND_URL=https://localhost:3000
```

### Step 5: Install Backend Dependencies

```powershell
cd backend
npm install
```

### Step 6: Generate SSL Certificate

```powershell
npm run generate-keys
```

Import into Windows Trusted Root Store (so Chrome/Edge trust it):
```powershell
Import-Certificate -FilePath "keys\server.cert" -CertStoreLocation Cert:\LocalMachine\Root
```

### Step 7: Seed the Database

```powershell
npm run seed
```

### Step 8: Install & Build Frontend

```powershell
cd ..\frontend
npm install
npm run build
```

### Step 9: Open Firewall Port

```powershell
New-NetFirewallRule -DisplayName "APDS v3 HTTPS" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

### Step 10: Configure EC2 Security Group

In AWS Console → EC2 → Security Groups → Edit inbound rules:
- Add rule: **Custom TCP** | Port **3001** | Source **0.0.0.0/0** (or your IP)

### Step 11: Start the Server

```powershell
cd ..\backend
npm start
```

### Step 12: Access the Application

- Local: **https://localhost:3001**
- Remote: **https://YOUR-EC2-PUBLIC-IP:3001**

Accept the certificate warning on first visit (self-signed cert).

---

## Login Credentials

| Role | Username | Account Number | Password |
|------|----------|---------------|----------|
| Employee | Lindiwe | 1054083600 | Lindiwe@0701 |
| Customer | JohnN | 2067891234 | John@2024! |
| Customer | SarahM | 3078901234 | Sarah@2024! |

---

## EC2 Security Group Configuration

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| Custom TCP | TCP | 3001 | 0.0.0.0/0 |
| RDP | TCP | 3389 | Your IP |

---

## SSL Certificate Note

The deploy script generates a self-signed certificate and imports it into the Windows Trusted Root Certificate Store. **Chrome and Edge** will trust it automatically.

**Firefox** uses its own certificate store — navigate to `https://localhost:3001` and manually accept the certificate.

---

## Running as a Background Service (Optional)

To keep the server running after you close RDP:

```powershell
npm install -g pm2
pm2 start server.js --name "apds-v3"
pm2 save
pm2 startup
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "SSL keys not found" | Run `npm run generate-keys` in backend\ |
| "MongoDB connection error" | Start MongoDB service: `net start MongoDB` |
| Certificate warning in browser | Expected — click "Advanced" → "Proceed" |
| Cannot access from outside EC2 | Check Security Group has port 3001 open |
| "Too many requests" | Wait 15 minutes (rate limiting) |
| Port 3001 in use | `netstat -ano | findstr :3001` then `taskkill /PID <PID> /F` |
| PowerShell execution policy | Run: `Set-ExecutionPolicy Bypass -Scope Process -Force` |
