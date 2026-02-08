import { Global, Module, DynamicModule } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify'
import { ConfigModule } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'

import fastifyCookie from '@fastify/cookie'

import { appConfig, databaseConfig, jwtConfig, mailConfig, throttleConfig } from '@/common/config'
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter'
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor'
import { globalValidationPipe } from '@/common/pipes/validation.pipe'
import { DRIZZLE } from '@/database/drizzle.provider'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { RolesGuard } from '@/common/guards/roles.guard'
import { MAIL_PORT } from '@/modules/auth/domain/ports/out/mail.port'
import * as schema from '@/database/schema'

const mockMailService = {
  sendVerificationEmail: async () => {},
}

@Global()
@Module({})
class TestDatabaseModule {
  static forRoot(db: any): DynamicModule {
    return {
      module: TestDatabaseModule,
      providers: [{ provide: DRIZZLE, useValue: db }],
      exports: [DRIZZLE],
      global: true,
    }
  }
}

export interface TestApp {
  app: NestFastifyApplication
  module: TestingModule
  cleanup: () => Promise<void>
}

export async function createTestApp(
  modules: any[] = [],
  providers: any[] = [],
): Promise<TestApp> {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start()

  const connectionString = container.getConnectionUri()
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  // Create tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      email_verified BOOLEAN NOT NULL DEFAULT false,
      email_verification_token VARCHAR(255),
      email_verification_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      jti VARCHAR(255) NOT NULL UNIQUE,
      family_id VARCHAR(255) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      replaced_by_jti VARCHAR(255),
      revoked_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ NOT NULL,
      user_agent VARCHAR(500),
      ip VARCHAR(45),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS refresh_token_user_idx ON refresh_tokens(user_id)`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS refresh_token_family_idx ON refresh_tokens(family_id)`)

  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long!!'
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-at-least-32!!'
  process.env.MAIL_HOST = 'localhost'
  process.env.MAIL_PORT = '1025'

  const moduleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [appConfig, databaseConfig, jwtConfig, mailConfig, throttleConfig],
        envFilePath: ['.env.test', '.env'],
      }),
      TestDatabaseModule.forRoot(db),
      CqrsModule.forRoot(),
      ...modules,
    ],
    providers: [...providers],
  })

  moduleBuilder.overrideProvider(MAIL_PORT).useValue(mockMailService)

  const module = await moduleBuilder.compile()
  const app = module.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  )

  await app.register(fastifyCookie as any)

  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/health/ready'],
  })
  const { Reflector } = await import('@nestjs/core')
  const reflector = module.get(Reflector)
  app.useGlobalGuards(new JwtAuthGuard(reflector))
  app.useGlobalGuards(new RolesGuard(reflector))
  app.useGlobalPipes(globalValidationPipe)
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  await app.init()
  await app.getHttpAdapter().getInstance().ready()

  const cleanup = async () => {
    await app.close()
    await client.end()
    await container.stop()
  }

  return { app, module, cleanup }
}
