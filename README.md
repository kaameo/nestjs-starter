<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">NestJS Starter</h1>

<p align="center">Production-ready NestJS starter template. Fastify 기반, JWT 인증, PostgreSQL + Drizzle ORM, Kubernetes 배포를 고려한 확장 가능한 백엔드 boilerplate.</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-ea2845?style=flat-square&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Fastify-5-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169e1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-latest-c5f74f?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Vitest-latest-6e9f18?style=flat-square&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ed?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Kubernetes-ready-326ce5?style=flat-square&logo=kubernetes&logoColor=white" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/pnpm-latest-f69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/SWC-build-f8c457?style=flat-square&logo=swc&logoColor=black" alt="SWC" />
  <img src="https://img.shields.io/badge/Swagger-docs-85ea2d?style=flat-square&logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/JWT-auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Pino-logging-687634?style=flat-square&logoColor=white" alt="Pino" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" alt="License" />
</p>

---

## Features

- **Hexagonal Architecture + CQRS** — 도메인 중심 설계, Command/Query 분리
- **JWT Authentication** — Access + Refresh Token Rotation, 재사용 감지
- **Email Verification** — Nodemailer + Mailpit (개발), 회원가입 시 이메일 인증
- **Role-based Access Control** — `@Roles()` decorator + Guard
- **Rate Limiting** — `@nestjs/throttler`, 프로덕션 Redis 지원
- **Swagger API Docs** — 자동 생성 API 문서
- **Structured Logging** — Pino JSON 로그, Request ID 추적
- **Docker + K8s Ready** — Multi-stage Dockerfile, Kustomize 매니페스트, HPA
- **Testing** — Vitest + Supertest, 80%+ coverage 목표

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Docker & Docker Compose

### Installation

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, Mailpit)
pnpm docker:dev

# Push schema to database
pnpm db:push

# Start development server
pnpm start:dev
```

The API will be available at `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env.development` and configure:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nestjs_starter

# JWT
JWT_SECRET=your-access-secret
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d

# Mail (SMTP)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_FROM=noreply@nestjs-starter.local
MAIL_VERIFICATION_URL=http://localhost:3000/api/v1/auth/verify-email

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

## Architecture

Hexagonal Architecture (Ports & Adapters) + CQRS 패턴을 적용합니다.

```
┌─────────────────────────────────────────────┐
│            Infrastructure Layer             │
│  Controllers, Repository Adapters,          │
│  Hash/Token/Mail Adapters                   │
├─────────────────────────────────────────────┤
│            Application Layer                │
│  CQRS Command/Query Handlers, DTOs          │
├─────────────────────────────────────────────┤
│              Domain Layer                   │
│  Models, Ports (Use Cases, Repositories),   │
│  Domain Services                            │
└─────────────────────────────────────────────┘
```

**Dependency Rule**: Domain → 외부 의존 없음. Application → Domain만. Infrastructure → Port 인터페이스 구현.

### Project Structure

```
src/
├── main.ts                          # Fastify bootstrap
├── app.module.ts                    # Root module
├── common/                          # Guards, Filters, Interceptors, Pipes, Config
├── database/                        # Drizzle ORM provider & schema
├── modules/
│   ├── auth/                        # Authentication (JWT, Email verification)
│   │   ├── domain/                  # Ports, Services, Models
│   │   ├── application/             # CQRS Handlers, DTOs
│   │   └── infrastructure/          # Adapters, Strategies, Controllers
│   ├── user/                        # User CRUD
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   └── health/                      # K8s health probes
└── shared/                          # Pagination utilities
```

## API Endpoints

Global prefix: `/api/v1`

### Auth (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sign-up` | Public | 회원가입 + 인증 메일 발송 |
| POST | `/verify-email` | Public | 이메일 인증 (API) |
| GET | `/verify-email?token=` | Public | 이메일 인증 (링크) |
| POST | `/resend-verification` | Public | 인증 메일 재발송 |
| POST | `/sign-in` | Public | 로그인 |
| POST | `/refresh` | Refresh Token | 토큰 갱신 |
| POST | `/sign-out` | Access Token | 로그아웃 |

### User (`/api/v1/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Access Token | 내 정보 조회 |
| PATCH | `/me` | Access Token | 내 정보 수정 |
| GET | `/` | Admin | 전체 사용자 목록 |
| GET | `/:id` | Admin | 특정 사용자 조회 |
| DELETE | `/:id` | Admin | 사용자 삭제 |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/health/ready` | Readiness probe (DB check) |

### Response Format

```json
// Success
{ "success": true, "data": {}, "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 0 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": null } }
```

## Authentication Flow

1. **Sign Up** → Argon2 password hashing → User 생성 → 인증 메일 발송
2. **Verify Email** → 토큰 검증 → Access + Refresh Token 발급
3. **Sign In** → 이메일 인증 확인 → Access + Refresh Token 발급
4. **Refresh** → Refresh Token Rotation (재사용 감지 시 전체 무효화)
5. **Sign Out** → 해당 사용자의 모든 Refresh Token revoke

| Token | Expiry | Storage |
|-------|--------|---------|
| Access Token | 15m | Client memory |
| Refresh Token | 7d | httpOnly cookie + DB (hashed) |

## Scripts

```bash
pnpm build              # Production build (SWC)
pnpm start:dev          # Development with watch
pnpm start:prod         # Production start

pnpm test               # Run unit + integration tests
pnpm test:watch         # Watch mode
pnpm test:cov           # Coverage report (threshold: 80%)
pnpm test:e2e           # E2E tests

pnpm lint               # ESLint
pnpm lint:fix           # ESLint auto-fix
pnpm format             # Prettier

pnpm db:generate        # Generate migration
pnpm db:migrate         # Run migrations
pnpm db:push            # Push schema (dev only)
pnpm db:studio          # Drizzle Studio

pnpm docker:dev         # Start dev infrastructure
pnpm docker:down        # Stop dev infrastructure
```

## Docker

### Development

```bash
pnpm docker:dev
```

Starts PostgreSQL, Redis, and Mailpit (SMTP mock at `:1025`, Web UI at `:8025`).

### Production Build

```bash
docker build -f docker/Dockerfile -t nestjs-starter .
```

Multi-stage build: dependencies → build → production (only `dist/` + prod dependencies).

## Kubernetes

Kustomize 기반 배포 매니페스트가 `k8s/` 디렉토리에 포함되어 있습니다.

```bash
# Base
kubectl apply -k k8s/base

# Production overlay
kubectl apply -k k8s/overlays/production
```

Features:
- Rolling update (zero-downtime)
- HPA (CPU 70%, 2–10 replicas)
- Liveness + Readiness probes
- Resource limits (CPU: 100m–500m, Memory: 256Mi–512Mi)
- ConfigMap + Secret 기반 환경 설정

## Swagger

Development 환경에서 `http://localhost:3000/api/v1/docs` 로 접근 가능합니다.

## License

MIT
