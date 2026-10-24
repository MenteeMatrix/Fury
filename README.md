# ⭐ Fury — API Gateway & BFF Base Server

> **AssessVerse Microservice Repository:** `assessverse-fury`  
> **Role:** Single public entry point for all AssessVerse client applications. Implements reverse proxying, JWT validation, circuit-breaker resiliency, distributed rate limiting, and BFF (Backend-For-Frontend) data aggregation.

---

## 🌟 Key Responsibilities

- **Single Public Surface:** Only service exposed on public port (default `8000`). All downstream microservices run in a private network.
- **Circuit Breakers (Opossum):** Wraps all internal service calls (`rogers`, `stark`, `jarvis`). Prevents cascading failures with automatic fallbacks and health monitoring.
- **Distributed Rate Limiting:** Enforces IP and token-based rate limits via Redis.
- **BFF Aggregation:** Single call to `/api/v1/dashboard` fans out to multiple services in parallel and merges responses.
- **Trace ID Injection:** Automatically propagates `X-Request-ID` across all downstream microservices.

---

## 🚀 Quick Start (Standalone Repository)

### Prerequisites
- Node.js >= 20 LTS
- Redis (optional for local standalone, default fallback provided)

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

### 3. Run in Development
```bash
npm run dev
```

### 4. Build & Production Start
```bash
npm run build
npm start
```

---

## 📡 API Routing Overview

| Public Route | Method | Downstream Microservice | Auth Required | Description |
|---|---|---|---|---|
| `/health/liveness` | `GET` | Self (Fury) | ❌ | Pod liveness probe |
| `/health/readiness` | `GET` | Self (Fury) | ❌ | Circuit breaker readiness check |
| `/api/v1/auth/register` | `POST` | `rogers` (Auth) | ❌ | User signup |
| `/api/v1/auth/login` | `POST` | `rogers` (Auth) | ❌ | User sign-in (issues JWT) |
| `/api/v1/auth/refresh` | `POST` | `rogers` (Auth) | ❌ | Refresh access token |
| `/api/v1/auth/me` | `GET` | `rogers` (Auth) | ✅ | Current user profile |
| `/api/v1/assessments` | `GET` | `stark` (Assessment) | ✅ | List assessments |
| `/api/v1/assessments` | `POST` | `stark` (Assessment) | ✅ (Professor) | Create assessment |
| `/api/v1/assessments/:id` | `GET` | `stark` (Assessment) | ✅ | Get assessment details |
| `/api/v1/assessments/:id/generate-questions` | `POST` | `stark` → `jarvis` | ✅ (Professor) | Trigger AI question generation |
| `/api/v1/dashboard` | `GET` | `stark` + `rogers` | ✅ | Aggregated BFF dashboard response |

---

## 🐳 Docker Deployment

```bash
docker build -t assessverse-fury .
docker run -p 8000:8000 --env-file .env assessverse-fury
```
