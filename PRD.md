# PRD: NestJS Starter

## 1. Overview

Production-ready NestJS starter template. Fastify 기반, JWT 인증, PostgreSQL + Drizzle ORM, K8s 분산 배포를 고려한 확장 가능한 백엔드 boilerplate.

### 1.1 Goals

- 즉시 프로덕션 배포 가능한 NestJS 프로젝트 템플릿 제공
- 분산 환경(K8s multi-pod)에서 안정적으로 동작하는 아키텍처
- 개발(Docker Compose) / 프로덕션(K8s) 환경 분리
- 타입 안전성, 테스트 커버리지, API 문서화 기본 내장

### 1.2 Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js 22 LTS |
| Framework | NestJS 11 + Fastify |
| Language | TypeScript 5.7+ (strict mode) |
| Build | SWC |
| Package Manager | pnpm |
| Database | PostgreSQL 16 |
| ORM | Drizzle ORM |
| Validation | class-validator + class-transformer (DTO) / Zod (config) |
| Authentication | JWT (Access + Refresh Token) |
| Password Hashing | Argon2 |
| Architecture | Hexagonal Architecture + CQRS (@nestjs/cqrs) |
| Logging | Pino (nestjs-pino) |
| API Docs | Swagger (nestjs-swagger) |
| Testing | Vitest + Supertest |
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes |
| Rate Limiting | @nestjs/throttler (prod: Redis storage) |
| Email | Nodemailer |

---

## 2. Architecture

### 2.1 Project Structure (Hexagonal Architecture)

```
nestjs-starter/
├── src/
│   ├── main.ts                              # Fastify bootstrap
│   ├── app.module.ts                        # Root module
│   │
│   ├── common/                              # 공통 인프라
│   │   ├── config/                          # Configuration (환경별 설정)
│   │   │   ├── app.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   ├── mail.config.ts
│   │   │   └── throttle.config.ts
│   │   ├── decorators/                      # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/                         # Exception filters
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/                          # Guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── jwt-refresh.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/                    # Interceptors
│   │   │   ├── response.interceptor.ts
│   │   │   └── serialize.interceptor.ts     # class-transformer 응답 직렬화
│   │   ├── pipes/                           # Pipes
│   │   │   └── validation.pipe.ts
│   │   └── types/                           # 공통 타입
│   │       └── api-response.type.ts
│   │
│   ├── modules/
│   │   ├── auth/                            # ── Auth 모듈 ──
│   │   │   ├── auth.module.ts
│   │   │   ├── domain/                      # Domain Layer (핵심 비즈니스)
│   │   │   │   ├── models/
│   │   │   │   │   └── token-pair.model.ts
│   │   │   │   ├── ports/                   # Port 인터페이스
│   │   │   │   │   ├── in/
│   │   │   │   │   │   ├── sign-up.use-case.ts
│   │   │   │   │   │   ├── sign-in.use-case.ts
│   │   │   │   │   │   ├── verify-email.use-case.ts
│   │   │   │   │   │   ├── resend-verification.use-case.ts
│   │   │   │   │   │   ├── refresh-token.use-case.ts
│   │   │   │   │   │   └── sign-out.use-case.ts
│   │   │   │   │   └── out/
│   │   │   │   │       ├── hash.port.ts
│   │   │   │   │       ├── token.port.ts
│   │   │   │   │       └── mail.port.ts
│   │   │   │   └── services/
│   │   │   │       └── auth.service.ts      # 비즈니스 로직 (포트 구현 사용)
│   │   │   ├── application/                 # Application Layer (CQRS)
│   │   │   │   ├── commands/
│   │   │   │   │   ├── sign-up.command.ts
│   │   │   │   │   ├── sign-up.handler.ts
│   │   │   │   │   ├── sign-in.command.ts
│   │   │   │   │   ├── sign-in.handler.ts
│   │   │   │   │   ├── verify-email.command.ts
│   │   │   │   │   ├── verify-email.handler.ts
│   │   │   │   │   ├── resend-verification.command.ts
│   │   │   │   │   ├── resend-verification.handler.ts
│   │   │   │   │   ├── refresh-token.command.ts
│   │   │   │   │   ├── refresh-token.handler.ts
│   │   │   │   │   ├── sign-out.command.ts
│   │   │   │   │   └── sign-out.handler.ts
│   │   │   │   └── dto/                     # class-validator + class-transformer DTOs
│   │   │   │       ├── sign-up.dto.ts
│   │   │   │       ├── sign-in.dto.ts
│   │   │   │       ├── verify-email.dto.ts
│   │   │   │       └── token-response.dto.ts
│   │   │   └── infrastructure/              # Infrastructure Layer (어댑터)
│   │   │       ├── adapters/
│   │   │       │   ├── argon2-hash.adapter.ts    # HashPort 구현
│   │   │       │   ├── jwt-token.adapter.ts      # TokenPort 구현
│   │   │       │   └── nodemailer-mail.adapter.ts # MailPort 구현
│   │   │       ├── schema/
│   │   │       │   └── refresh-token.schema.ts
│   │   │       └── strategies/
│   │   │           ├── jwt.strategy.ts
│   │   │           └── jwt-refresh.strategy.ts
│   │   │
│   │   ├── user/                            # ── User 모듈 ──
│   │   │   ├── user.module.ts
│   │   │   ├── domain/                      # Domain Layer
│   │   │   │   ├── models/
│   │   │   │   │   └── user.model.ts        # 도메인 엔티티
│   │   │   │   ├── ports/
│   │   │   │   │   ├── in/
│   │   │   │   │   │   ├── get-user.use-case.ts
│   │   │   │   │   │   ├── update-user.use-case.ts
│   │   │   │   │   │   └── delete-user.use-case.ts
│   │   │   │   │   └── out/
│   │   │   │   │       └── user-repository.port.ts
│   │   │   │   └── services/
│   │   │   │       └── user.service.ts
│   │   │   ├── application/                 # Application Layer (CQRS)
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create-user.command.ts
│   │   │   │   │   ├── create-user.handler.ts
│   │   │   │   │   ├── update-user.command.ts
│   │   │   │   │   ├── update-user.handler.ts
│   │   │   │   │   ├── delete-user.command.ts
│   │   │   │   │   └── delete-user.handler.ts
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get-user.query.ts
│   │   │   │   │   ├── get-user.handler.ts
│   │   │   │   │   ├── list-users.query.ts
│   │   │   │   │   └── list-users.handler.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-user.dto.ts
│   │   │   │       ├── update-user.dto.ts
│   │   │   │       └── user-response.dto.ts # @Exclude(), @Expose() 로 응답 직렬화
│   │   │   └── infrastructure/              # Infrastructure Layer
│   │   │       ├── adapters/
│   │   │       │   └── drizzle-user-repository.adapter.ts  # UserRepositoryPort 구현
│   │   │       ├── controllers/
│   │   │       │   └── user.controller.ts   # Driving Adapter (HTTP)
│   │   │       └── schema/
│   │   │           └── user.schema.ts       # Drizzle schema
│   │   │
│   │   ├── post/                            # ── Post 모듈 (도메인 확장 예시, 구현 대상 아님) ──
│   │   │   ├── post.module.ts
│   │   │   ├── domain/                      # Domain Layer
│   │   │   │   ├── models/
│   │   │   │   │   └── post.model.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── in/
│   │   │   │   │   │   ├── create-post.use-case.ts
│   │   │   │   │   │   ├── update-post.use-case.ts
│   │   │   │   │   │   └── delete-post.use-case.ts
│   │   │   │   │   └── out/
│   │   │   │   │       └── post-repository.port.ts
│   │   │   │   └── services/
│   │   │   │       └── post.service.ts
│   │   │   ├── application/                 # Application Layer (CQRS)
│   │   │   │   ├── commands/
│   │   │   │   │   ├── create-post.command.ts
│   │   │   │   │   ├── create-post.handler.ts
│   │   │   │   │   ├── update-post.command.ts
│   │   │   │   │   ├── update-post.handler.ts
│   │   │   │   │   ├── delete-post.command.ts
│   │   │   │   │   └── delete-post.handler.ts
│   │   │   │   ├── queries/
│   │   │   │   │   ├── get-post.query.ts
│   │   │   │   │   ├── get-post.handler.ts
│   │   │   │   │   ├── list-posts.query.ts
│   │   │   │   │   └── list-posts.handler.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-post.dto.ts
│   │   │   │       ├── update-post.dto.ts
│   │   │   │       └── post-response.dto.ts
│   │   │   └── infrastructure/              # Infrastructure Layer
│   │   │       ├── adapters/
│   │   │       │   └── drizzle-post-repository.adapter.ts
│   │   │       ├── controllers/
│   │   │       │   └── post.controller.ts
│   │   │       └── schema/
│   │   │           └── post.schema.ts
│   │   │
│   │   └── health/                          # Health check (K8s probes)
│   │       ├── health.module.ts
│   │       └── health.controller.ts
│   │
│   ├── database/                            # 공유 DB 인프라
│   │   ├── database.module.ts
│   │   ├── drizzle.provider.ts
│   │   └── migrations/
│   │
│   └── shared/                              # 공유 유틸리티
│       └── utils/
│           └── pagination.util.ts
├── test/
│   ├── setup.ts                         # Vitest global setup
│   ├── helpers/                         # 테스트 유틸리티
│   │   └── test-app.helper.ts
│   ├── unit/                            # Unit tests
│   ├── integration/                     # Integration tests
│   └── e2e/                             # E2E tests
├── docker/
│   ├── Dockerfile                       # Multi-stage build
│   └── docker-compose.yml              # Dev environment
├── k8s/
│   ├── base/                            # Kustomize base
│   │   ├── kustomization.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── configmap.yaml
│   └── overlays/
│       └── production/
│           ├── kustomization.yaml
│           └── patches/
├── drizzle.config.ts                    # Drizzle Kit 설정
├── vitest.config.ts                     # Vitest 설정
├── tsconfig.json
├── tsconfig.build.json
├── .env.example
├── .env.development
├── .env.test
└── package.json
```

### 2.2 Module Dependencies

```
AppModule
├── ConfigModule (global)
├── LoggerModule (Pino, global)
├── ThrottlerModule (global)
├── CqrsModule (global)
├── DatabaseModule
│   └── DrizzleProvider (PostgreSQL connection)
├── AuthModule
│   ├── JwtModule
│   ├── UserModule (forwardRef)
│   ├── Strategies (JWT, Refresh)
│   └── Command Handlers (SignUp, SignIn, Refresh, SignOut)
├── UserModule
│   ├── DatabaseModule
│   ├── Command Handlers (Create, Update, Delete)
│   └── Query Handlers (GetUser, ListUsers)
├── PostModule                               # (도메인 확장 예시, 구현 대상 아님)
│   ├── DatabaseModule
│   ├── Command Handlers (Create, Update, Delete)
│   └── Query Handlers (GetPost, ListPosts)
└── HealthModule
```

### 2.3 Hexagonal Architecture

각 모듈은 3개 레이어로 구성:

```
┌─────────────────────────────────────────────────┐
│                Infrastructure Layer              │
│  Controllers (Driving Adapter, HTTP inbound)     │
│  Drizzle Repository Adapters (Driven Adapter)    │
│  Argon2 Hash Adapter, JWT Token Adapter           │
│  Nodemailer Mail Adapter                          │
├─────────────────────────────────────────────────┤
│                Application Layer                 │
│  CQRS Command Handlers / Query Handlers          │
│  DTOs (class-validator + class-transformer)       │
├─────────────────────────────────────────────────┤
│                  Domain Layer                    │
│  Domain Models (순수 TypeScript, 프레임워크 무관)   │
│  Ports: Inbound (Use Cases) / Outbound (Repos)   │
│  Domain Services (비즈니스 로직)                   │
└─────────────────────────────────────────────────┘
```

**Dependency Rule**: Domain은 어떤 레이어에도 의존하지 않는다. Application은 Domain에만 의존한다. Infrastructure는 Application/Domain의 Port를 구현한다.

### 2.4 Architecture Patterns

- **Hexagonal (Ports & Adapters)**: Domain은 Port 인터페이스만 정의, Infrastructure에서 Adapter로 구현
- **CQRS**: Command(쓰기)와 Query(읽기) 분리, `@nestjs/cqrs` 사용
- **Module-based organization**: Feature별 독립 모듈 (auth, user, post)
- **Validation 이중 구조**: Zod(환경변수, config 검증) + class-validator(DTO 검증)
- **Serialization**: class-transformer `@Exclude()`, `@Expose()`로 응답에서 민감 필드 제거
- **Global modules**: Config, Logger, Throttler, CqrsModule은 global 등록
- **Guards for auth**: JWT 인증은 Guard를 통해 처리, `@Public()` decorator로 미인증 엔드포인트 표시
- **Exception filters**: 전역 예외 필터로 일관된 에러 응답 포맷
- **Global prefix**: 모든 엔드포인트에 `/api/v1` prefix 적용

---

## 3. Data Models

### 3.1 User

```typescript
// src/modules/user/infrastructure/schema/user.schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'user' | 'admin'
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerificationToken: varchar('email_verification_token', { length: 255 }),
  emailVerificationExpires: timestamp('email_verification_expires', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

### 3.2 Post (도메인 확장 예시 — 구현 대상 아님)

```typescript
// src/modules/post/infrastructure/schema/post.schema.ts
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  published: boolean('published').notNull().default(false),
  authorId: uuid('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))
```

### 3.3 Refresh Token

```typescript
// src/modules/auth/infrastructure/schema/refresh-token.schema.ts
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jti: varchar('jti', { length: 255 }).notNull().unique(),
  familyId: varchar('family_id', { length: 255 }).notNull(),
  tokenHash: varchar('token_hash', { length: 500 }).notNull(),
  replacedByJti: varchar('replaced_by_jti', { length: 255 }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  userAgent: varchar('user_agent', { length: 500 }),
  ip: varchar('ip', { length: 45 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

### 3.4 Index Strategy

```typescript
// user: email unique index (자동 생성)
// post: author 기반 조회 + 발행 여부 필터링
export const postAuthorIdx = index('post_author_idx').on(posts.authorId)
export const postPublishedIdx = index('post_published_idx').on(posts.published, posts.createdAt)

// refresh_token: 사용자별 조회, 계보 추적
export const refreshTokenUserIdx = index('refresh_token_user_idx').on(refreshTokens.userId)
export const refreshTokenFamilyIdx = index('refresh_token_family_idx').on(refreshTokens.familyId)
```

---

## 4. Authentication

### 4.1 JWT Token Flow

```
[Sign Up] POST /api/v1/auth/sign-up
  → 비밀번호 해싱 (Argon2id)
  → User 생성 (emailVerified: false)
  → 인증 토큰 생성 (crypto.randomUUID, 24시간 유효)
  → 인증 메일 발송 (Nodemailer)
  → 응답: 회원가입 완료, 이메일 확인 필요 안내

[Verify Email - API] POST /api/v1/auth/verify-email
  → 인증 토큰 검증 (만료 여부 확인)
  → emailVerified: true 업데이트
  → 인증 토큰 삭제
  → Access Token + Refresh Token 발급

[Verify Email - Link] GET /api/v1/auth/verify-email?token=xxx
  → 인증 토큰 검증 (만료 여부 확인)
  → emailVerified: true 업데이트
  → 인증 토큰 삭제
  → 성공/실패 JSON 응답 (프론트엔드 없이 직접 확인 가능)

[Email Verification Rules]
  - 인증 토큰은 1회성: 성공적으로 사용 후 즉시 삭제
  - 이미 인증된 계정으로 재요청 시: 200 응답 (idempotent), 토큰 무시
  - 실패 응답 코드: TOKEN_EXPIRED (만료), TOKEN_INVALID (잘못된 토큰), ALREADY_VERIFIED (이미 인증)

[Resend Verification] POST /api/v1/auth/resend-verification
  → 미인증 사용자 확인
  → 기존 토큰 무효화 + 새 토큰 생성
  → 인증 메일 재발송

[Sign In] POST /api/v1/auth/sign-in
  → 이메일/비밀번호 검증
  → 이메일 인증 여부 확인 (미인증 시 403)
  → Access Token + Refresh Token 발급
  → refresh_tokens 테이블에 jti, familyId와 함께 저장

[Token Refresh] POST /api/v1/auth/refresh
  → Refresh Token 검증 (Guard)
  → jti로 조회, familyId로 계보 추적. 이미 사용(revokedAt != null)된 토큰이면 해당 familyId 전체 무효화 (재사용 감지)
  → 동시성 정책: first-writer-wins (DB 트랜잭션 + 조건부 업데이트)
    - 첫 번째 refresh 요청만 성공, revokedAt 설정
    - 이후 동일 jti refresh 시도 → 이미 사용된 토큰으로 감지 → familyId 전체 무효화
  → Grace window: 동일 jti 재사용이 revokedAt 이후 10초 이내면 네트워크 재전송으로 간주하여 무시 (이미 발급된 새 토큰 반환). 10초 초과 시 탈취 의심 → familyId 전체 무효화.
  → 새 Access Token + Refresh Token 발급 (Rotation)

[Sign Out] POST /api/v1/auth/sign-out
  → 해당 사용자의 활성 refresh token 전체 revoke
```

### 4.2 Token Specification

| Token | Payload | Expiry | Storage |
|-------|---------|--------|---------|
| Access Token | `{ sub: userId, email, role }` | 15m | Client (Memory/Header) |
| Refresh Token | `{ sub: userId, jti: tokenId }` | 7d | Client (httpOnly cookie) + DB (refresh_tokens 테이블, hashed) |

> **Refresh Token Cookie 속성:**
> - `HttpOnly`: true (JavaScript 접근 차단)
> - `Secure`: production에서 true (HTTPS 전용)
> - `SameSite`: Lax (CSRF 방지, OAuth 리다이렉트 호환)
> - `Path`: `/api/v1/auth/refresh` (불필요한 전송 방지)
> - `Max-Age`: 604800 (7일, JWT_REFRESH_EXPIRATION과 동일)

### 4.3 K8s Multi-Pod 고려사항

- **Stateless JWT**: 서버 세션 없음, 모든 pod에서 동일한 JWT_SECRET으로 토큰 검증
- **Refresh Token은 DB 기반**: 모든 pod가 동일한 PostgreSQL을 바라보므로 토큰 회전 안전
- JWT_SECRET, JWT_REFRESH_SECRET은 K8s Secret으로 관리

---

## 5. API Endpoints

Global prefix: `app.setGlobalPrefix('api/v1')` (main.ts에서 설정)

### 5.1 Auth (`/api/v1/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/sign-up` | Public | 회원가입 + 인증 메일 발송 |
| POST | `/api/v1/auth/verify-email` | Public | 이메일 인증 (토큰 검증, API 클라이언트용) |
| GET | `/api/v1/auth/verify-email?token=` | Public | 이메일 인증 (링크 클릭용) |
| POST | `/api/v1/auth/resend-verification` | Public | 인증 메일 재발송 |
| POST | `/api/v1/auth/sign-in` | Public | 로그인 (인증된 이메일만) |
| POST | `/api/v1/auth/refresh` | Refresh Token | 토큰 갱신 |
| POST | `/api/v1/auth/sign-out` | Access Token | 로그아웃 |

### 5.2 User (`/api/v1/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/users/me` | Access Token | 내 정보 조회 |
| PATCH | `/api/v1/users/me` | Access Token | 내 정보 수정 |
| GET | `/api/v1/users` | Admin | 전체 사용자 목록 (paginated) |
| GET | `/api/v1/users/:id` | Admin | 특정 사용자 조회 |
| DELETE | `/api/v1/users/:id` | Admin | 사용자 삭제 |
| GET | `/api/v1/users/me/posts` | Access Token | 내 게시글 목록 (paginated) |

### 5.3 Post (`/api/v1/posts`)

> 아래 엔드포인트는 도메인 모듈 추가 시 참고 예시입니다. 기본 boilerplate에는 포함되지 않습니다.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/posts` | Access Token | 게시글 작성 |
| GET | `/api/v1/posts` | Public | 게시글 목록 (published만, paginated) |
| GET | `/api/v1/posts/:id` | Public | 게시글 상세 |
| PATCH | `/api/v1/posts/:id` | Owner/Admin | 게시글 수정 |
| DELETE | `/api/v1/posts/:id` | Owner/Admin | 게시글 삭제 |

> **소유권 판정**: `post.authorId === req.user.sub`로 확인. 권한 실패 시 `403 Forbidden` 응답.
> Admin은 모든 게시글에 대해 수정/삭제 권한 보유.

### 5.4 Health (`/health`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | Liveness probe (prefix 제외) |
| GET | `/health/ready` | Public | Readiness probe (prefix 제외) |

> Health 엔드포인트는 K8s probe 호환을 위해 global prefix에서 제외 (`exclude` 옵션)

> **Readiness 판정 기준**: DB `SELECT 1` 쿼리 성공 여부. timeout: 3초, 실패 시 503. fail-close 정책(DB 연결 불가 시 트래픽 수신 중단). 연속 실패 임계: K8s probe `failureThreshold: 3`으로 3회 연속 실패 시 unready 전환, `successThreshold: 1`로 1회 성공 시 ready 복귀.

### 5.5 API Response Format

```typescript
// 성공
{
  "success": true,
  "data": T,
  "meta": {                    // paginated 응답 시
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number
  }
}

// 에러
{
  "success": false,
  "error": {
    "code": string,            // "VALIDATION_ERROR", "UNAUTHORIZED" 등
    "message": string,
    "details": object | null   // class-validator 에러 시 field-level 상세 (property, constraints 포맷)
  }
}

// class-validator 에러 예시
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "property": "email", "constraints": { "isEmail": "email must be an email" } },
      { "property": "name", "constraints": { "isNotEmpty": "name should not be empty" } }
    ]
  }
}
```

### 5.6 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | 입력값 검증 실패 |
| UNAUTHORIZED | 401 | 인증 필요 (토큰 미제공 또는 인증 헤더 누락) |
| FORBIDDEN | 403 | 권한 부족 (인증은 되었으나 접근 불가) |
| NOT_FOUND | 404 | 리소스를 찾을 수 없음 |
| CONFLICT | 409 | 이미 존재하는 리소스 (중복 이메일 등) |
| TOKEN_EXPIRED | 401 | 인증/이메일 토큰 만료 |
| TOKEN_INVALID | 401 | 잘못된 토큰 |
| ALREADY_VERIFIED | 200 | 이미 인증된 이메일 (idempotent 응답) |
| EMAIL_NOT_VERIFIED | 403 | 이메일 미인증 상태로 로그인 시도 |
| RATE_LIMITED | 429 | 요청 횟수 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

## 6. Configuration

### 6.1 Environment Variables

```env
# Application
NODE_ENV=development           # development | test | production
PORT=3000
HOST=0.0.0.0

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

# Rate Limiting
THROTTLE_TTL=60000             # ms
THROTTLE_LIMIT=100             # requests per TTL

# Mail (SMTP)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=noreply@nestjs-starter.local
MAIL_VERIFICATION_URL=http://localhost:3000/api/v1/auth/verify-email

# Rate Limiting (Production)
REDIS_HOST=localhost
REDIS_PORT=6379

# Logging
LOG_LEVEL=info                 # debug | info | warn | error
```

> **Production 보안 규칙:**
> - `JWT_SECRET`, `JWT_REFRESH_SECRET`: 최소 32자, 랜덤 생성 필수 (weak default 금지)
> - `DATABASE_PASSWORD`: production에서 기본값(`postgres`) 사용 금지
> - 모든 시크릿은 K8s Secret 또는 외부 비밀 관리자(Vault 등)를 통해 주입
> - `.env.production` 파일은 VCS에 포함하지 않음 (`.gitignore`)

### 6.2 Config Module Design

```typescript
// @nestjs/config + Zod validation
// 앱 시작 시 환경변수 유효성 검증, 잘못된 설정이면 즉시 실패
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_HOST: z.string(),
  // ...
})
```

---

## 7. Rate Limiting

### 7.1 Strategy

- **@nestjs/throttler** 사용
- Development/Test: in-memory (기본, 별도 설정 없이 동작)
- Production (K8s): Redis 기반 (@nestjs/throttler-storage-redis)
  - 모든 pod가 동일한 Redis를 바라봐 정확한 rate limiting 보장
- 글로벌 기본값: 60초당 100 requests
- 인증 엔드포인트: 더 엄격한 제한 적용

### 7.2 Endpoint별 제한

| Endpoint | TTL | Limit | 비고 |
|----------|-----|-------|------|
| Global default | 60s | 100 | 모든 엔드포인트 기본값 |
| POST /api/v1/auth/sign-in | 60s | 10 | Brute-force 방지 |
| POST /api/v1/auth/sign-up | 60s | 5 | 스팸 계정 방지 |
| POST /api/v1/auth/resend-verification | 60s | 3 | 메일 발송 남용 방지 |
| POST /api/v1/auth/refresh | 60s | 20 | 토큰 갱신 |

### 7.3 Fastify Adapter

```typescript
// Throttler는 Fastify와 사용 시 ThrottlerGuard override 필요
// req.ip 대신 req.raw.ip 또는 req.ips 사용
```

---

## 8. Logging

### 8.1 Pino Configuration

```typescript
// nestjs-pino 사용
// 구조화된 JSON 로그 (K8s/ELK 호환)
{
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  // production에서는 JSON 출력 (pino-pretty 없음)
}
```

### 8.2 Logging Standards

- **Request logging**: 모든 HTTP 요청/응답 자동 로깅 (nestjs-pino)
- **Request ID**: 모든 요청에 고유 ID 부여 (분산 추적)
- **Sensitive data masking**: password, token 필드 자동 마스킹
- **Log levels**: error(에러), warn(비정상 동작), info(주요 이벤트), debug(상세 디버깅)

### 8.3 Observability (Minimum)

최소 메트릭 (로그 기반 추출 또는 향후 Prometheus 연동):
- **요청 수**: 엔드포인트별 총 요청 count
- **응답 지연**: p50, p95, p99 latency
- **에러율**: HTTP 4xx/5xx 비율
- **DB 쿼리 지연**: 슬로우 쿼리 로깅 (threshold: 500ms)

> 초기 구현은 Pino 로그에서 추출. 프로덕션 확장 시 Prometheus + Grafana 권장.

---

## 9. Testing

### 9.1 Framework: Vitest

```typescript
// vitest.config.ts
{
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, branches: 80, functions: 80 }
    },
    setupFiles: ['test/setup.ts'],
  }
}
```

### 9.2 Test Categories

| Type | Location | Target | Tool |
|------|----------|--------|------|
| Unit | `test/unit/` | Services, Utils | Vitest |
| Integration | `test/integration/` | Controllers + DB | Vitest + Supertest + TestContainers |
| E2E | `test/e2e/` | Full API flows | Vitest + Supertest + TestContainers |

### 9.3 Test Strategy

- **Unit tests**: Service 로직, Util 함수, Guard/Pipe 개별 테스트
- **Integration tests**: 실제 PostgreSQL(TestContainers)과 함께 API 엔드포인트 테스트
- **E2E tests**: 회원가입 → 로그인 → 게시글 CRUD 전체 흐름
- **최소 커버리지**: 80%

### 9.4 Test DB Isolation

```typescript
// TestContainers로 테스트 suite별 독립 PostgreSQL 컨테이너 기동.
// 각 테스트 케이스는 트랜잭션 rollback으로 격리.
```

---

## 10. Docker

### 10.1 Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM deps AS build
COPY . .
RUN pnpm build

# Stage 3: Production
FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
RUN pnpm prune --prod
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 10.2 Docker Compose (Development)

```yaml
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
      target: deps
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    env_file:
      - .env.development
    depends_on:
      postgres:
        condition: service_healthy
    command: pnpm start:dev

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nestjs_starter
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"              # SMTP
      - "8025:8025"              # Web UI (메일 확인)

volumes:
  postgres_data:
```

---

## 11. Kubernetes (확장 배포 가이드)

> 이 섹션은 프로덕션 K8s 배포를 위한 확장 가이드입니다. 기본 개발 환경은 Docker Compose(섹션 10)로 충분합니다.

### 11.1 Design Principles

- **Stateless application**: JWT 기반이므로 pod 간 세션 공유 불필요
- **Graceful shutdown**: SIGTERM 핸들링, 진행 중 요청 완료 후 종료
- **Health probes**: Liveness(앱 생존) + Readiness(DB 연결) 분리
- **HPA**: CPU/Memory 기반 auto-scaling
- **Resource limits**: 명시적 CPU/Memory 제한

### 11.2 Deployment Spec

```yaml
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0          # Zero-downtime deploy
  template:
    spec:
      containers:
        - name: nestjs-starter
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          env:
            - name: NODE_ENV
              value: production
          envFrom:
            - configMapRef:
                name: nestjs-starter-config
            - secretRef:
                name: nestjs-starter-secrets
```

### 11.3 HPA

```yaml
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### 11.4 Graceful Shutdown

```typescript
// main.ts
app.enableShutdownHooks()

// NestJS lifecycle hooks 활용
// OnModuleDestroy에서 DB 연결 정리
// terminationGracePeriodSeconds: 30 (K8s)
```

---

## 12. Build & Scripts

### 12.1 SWC Build

```json
// nest-cli.json
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

### 12.2 Package Scripts

```json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:e2e": "vitest run --config vitest.e2e.config.ts",
    "lint": "eslint \"{src,test}/**/*.ts\"",
    "lint:fix": "eslint \"{src,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push",
    "docker:dev": "docker compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker compose -f docker/docker-compose.yml down"
  }
}
```

### 12.3 CI Pipeline (Minimum)

```yaml
# PR 기준 최소 검증
- pnpm lint
- pnpm build
- pnpm test          # unit + integration
# main merge gate (또는 nightly)
- pnpm test:e2e
# coverage threshold 80%+ 검사
```

> CI 구현은 GitHub Actions / GitLab CI 등 팀 환경에 맞게 선택. PR 단계에서는 unit + integration 테스트만 실행하고, e2e는 main merge gate 또는 nightly에서 실행.

---

## 13. Swagger

### 13.1 Setup

```typescript
// main.ts - production 제외 시 활성화
if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('NestJS Starter API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/v1/docs', app, document)
}
```

### 13.2 Documentation Rules

- 모든 Controller에 `@ApiTags()` 적용
- 모든 엔드포인트에 `@ApiOperation()` + `@ApiResponse()` 적용
- class-validator DTO에서 Swagger schema 자동 생성 (@nestjs/swagger plugin)

---

## 14. Security Checklist (목표 상태)

- [ ] 비밀번호 해싱 (Argon2id)
- [ ] JWT 기반 stateless 인증
- [ ] Refresh Token Rotation (재사용 감지 시 모든 토큰 무효화)
- [ ] Rate limiting (brute-force 방지)
- [ ] Helmet 보안 헤더 (@fastify/helmet)
- [ ] CORS 설정 (허용 origin 명시)
- [ ] 입력값 검증 (class-validator DTO + Zod config)
- [ ] SQL Injection 방지 (Drizzle parameterized queries)
- [ ] 민감 정보 환경변수 관리 (K8s Secrets)
- [ ] 이메일 인증 필수 (미인증 계정 로그인 차단)
- [ ] 토큰 만료 정책: Access Token (15m), Refresh Token (7d), Email 인증 토큰 (24h)
- [ ] 로그에서 민감 데이터 마스킹

---

## 15. Definition of Done (Boilerplate 완성 기준)

- [ ] `pnpm lint` — 에러 0건
- [ ] `pnpm build` — 빌드 성공
- [ ] `pnpm test` — 전체 테스트 통과, 커버리지 80%+
- [ ] `docker compose up` — app, postgres, redis, mailpit 정상 기동
- [ ] 핵심 API smoke test 통과:
  - 회원가입 → 이메일 인증 → 로그인 → 토큰 갱신 → 로그아웃
- [ ] Swagger UI 접근 가능 (`/api/v1/docs`)

---

## 16. Implementation Phases

### Phase 1: Foundation

1. pnpm init + NestJS CLI 프로젝트 생성 (Fastify + SWC)
2. 프로젝트 구조 생성 (directories)
3. 환경 설정 (ConfigModule + Zod validation)
4. Pino 로깅 설정
5. Global exception filter + response interceptor

### Phase 2: Database

1. Docker Compose로 PostgreSQL 기동
2. Drizzle ORM 설정 + provider
3. User, Post schema 정의
4. Migration 생성 및 적용
5. 마이그레이션 운영 규칙:
   - Development: `drizzle-kit push` (스키마 즉시 반영)
   - Test: 테스트 시작 시 자동 마이그레이션 (`drizzle-kit migrate`)
   - Production: 배포 파이프라인에서 `drizzle-kit migrate` 실행 (앱 기동 전)
   - Rollback: 역방향 마이그레이션 파일 수동 생성 후 적용
   - PR 검증: migration 파일 존재 여부 확인 (스키마 변경 시 migration 필수 동반)
   - Production: migration file 기반만 허용 (`drizzle-kit push` 금지)

### Phase 3: Authentication & Email Verification

1. Auth module (sign-up, sign-in)
2. Email verification (Nodemailer + Mailpit dev 환경)
3. JWT strategy (access token)
4. Refresh token strategy + rotation
5. Guards, decorators (`@CurrentUser`, `@Public`)
6. Sign-out (refresh token 무효화)

### Phase 4: Feature Modules

1. User module (CRUD, 권한 분리)
2. (참고) Post module — 도메인 확장 시 예시 코드 참조
3. Pagination 유틸리티
4. Rate limiting 적용

### Phase 5: API Documentation & Testing

1. Swagger 설정 + 전체 엔드포인트 문서화
2. Unit tests (services, guards, pipes)
3. Integration tests (controllers + DB)
4. E2E tests (전체 인증/CRUD 흐름)
5. 커버리지 80%+ 확인

### Phase 6: Containerization & Deployment

1. Dockerfile (multi-stage build)
2. Docker Compose (dev 환경 완성)
3. Health check 엔드포인트
4. Graceful shutdown
5. K8s manifests (Kustomize base + production overlay)
6. HPA 설정
