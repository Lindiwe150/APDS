# APDS v3 — Secure Employee International Payments Portal

## Security Features

| Protection | Implementation |
|-----------|---------------|
| HTTPS/SSL | Self-signed RSA 2048 certificate, all traffic encrypted |
| Password Hashing | bcrypt with 12 salt rounds |
| Input Whitelisting | RegEx validation on client AND server (defence in depth) |
| XSS Protection | Helmet.js security headers + CSP |
| Clickjacking | X-Frame-Options via Helmet |
| DDoS/Brute Force | Rate limiting (100 req/15min, 10 auth/15min) |
| Session Hijacking | JWT with 1-hour expiry |
| NoSQL Injection | Mongoose schema validation + input whitelisting |
| MIME Sniffing | X-Content-Type-Options via Helmet |
| Man-in-the-Middle | HTTPS enforced, HSTS header |
| CORS | Restricted to frontend origin only |
| No Registration | Users pre-created — eliminates account enumeration |

## Prerequisites

- Node.js 18+
- MongoDB running locally (or Atlas URI)
- OpenSSL (for certificate generation)

## Setup

```bash
# 1. Backend
cd backend
cp .env.example .env        # Edit with your MongoDB URI and a strong JWT secret
npm install
npm run generate-keys       # Creates SSL certificate
npm run seed                # Pre-creates employee + customer accounts

# 2. Frontend
cd ../frontend
npm install
npm run build               # Production build (served by backend)

# 3. Start
cd ../backend
npm start                   # https://localhost:3001
```

For development (hot reload):
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend (runs on https://localhost:3000, proxies API to :3001)
cd frontend && npm start
```

## Pre-seeded Credentials

| Role | Username | Account Number | Password |
|------|----------|---------------|----------|
| Employee | Lindiwe | 1054083600 | Lindiwe@0701 |
| Customer | JohnN | 2067891234 | John@2024! |
| Customer | SarahM | 3078901234 | Sarah@2024! |

## CircleCI + SonarQube Setup

1. Push this repo to GitHub
2. Connect the repo to [CircleCI](https://circleci.com)
3. Add these environment variables in CircleCI project settings:
   - `SONAR_PROJECT_KEY` — your SonarCloud project key
   - `SONAR_ORG` — your SonarCloud organization
   - `SONAR_TOKEN` — SonarCloud authentication token
4. Every push triggers: install → build → SonarQube scan (checks hotspots & code smells)

## Video Recording (OBS)

For the submission video, demonstrate:

1. **SSL** — Show `https://` in browser, click the padlock to show certificate details
2. **Login** — Log in as customer (JohnN), show no registration page exists
3. **Payment** — Create a payment with valid IBAN/SWIFT, show success
4. **Input Validation** — Try invalid inputs (letters in amount, bad IBAN), show rejection
5. **Employee Portal** — Log in as Lindiwe, verify the transaction, submit to SWIFT
6. **Rate Limiting** — Spam login with wrong password, show "too many attempts" error
7. **CircleCI** — Show the pipeline running and SonarQube results (hotspots/code smells)

Upload as **unlisted** to YouTube.
