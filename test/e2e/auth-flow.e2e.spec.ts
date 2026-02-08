import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'

import { AuthModule } from '@/modules/auth/auth.module'
import { UserModule } from '@/modules/user/user.module'
import { DRIZZLE } from '@/database/drizzle.provider'
import { users } from '@/database/schema'
import { eq } from 'drizzle-orm'
import { createTestApp, TestApp } from '../helpers/test-app.helper'

describe('Auth Flow (E2E)', () => {
  let testApp: TestApp
  let request: supertest.Agent

  beforeAll(async () => {
    testApp = await createTestApp([AuthModule, UserModule])
    request = supertest(testApp.app.getHttpServer())
  }, 60000)

  afterAll(async () => {
    await testApp?.cleanup()
  })

  it('should complete full auth lifecycle', async () => {
    // 1. Sign up
    const signUpResponse = await request
      .post('/api/v1/auth/sign-up')
      .send({
        email: 'e2e@example.com',
        password: 'password123',
        name: 'E2E User',
      })
      .expect(201)

    expect(signUpResponse.body.success).toBe(true)

    // 2. Attempt sign-in (should fail - not verified)
    await request
      .post('/api/v1/auth/sign-in')
      .send({
        email: 'e2e@example.com',
        password: 'password123',
      })
      .expect(401)

    // 3. Verify email (get token from DB directly)
    const db = testApp.module.get(DRIZZLE)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'e2e@example.com'))

    const verifyResponse = await request
      .post('/api/v1/auth/verify-email')
      .send({ token: user.emailVerificationToken })
      .expect(200)

    expect(verifyResponse.body.success).toBe(true)
    expect(verifyResponse.body.data.accessToken).toBeDefined()

    // 4. Sign in successfully
    const signInResponse = await request
      .post('/api/v1/auth/sign-in')
      .send({
        email: 'e2e@example.com',
        password: 'password123',
      })
      .expect(200)

    const { accessToken } = signInResponse.body.data

    // 5. Access protected endpoint
    const meResponse = await request
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(meResponse.body.data.email).toBe('e2e@example.com')

    // 6. Sign out
    await request
      .post('/api/v1/auth/sign-out')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
  })
})
