import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { JwtService } from '@nestjs/jwt'

import { AuthModule } from '@/modules/auth/auth.module'
import { UserModule } from '@/modules/user/user.module'
import { DRIZZLE } from '@/database/drizzle.provider'
import { users } from '@/database/schema'
import { createTestApp, TestApp } from '../../helpers/test-app.helper'

describe('UserController (Integration)', () => {
  let testApp: TestApp
  let request: supertest.Agent
  let accessToken: string

  beforeAll(async () => {
    testApp = await createTestApp([AuthModule, UserModule])
    request = supertest(testApp.app.getHttpServer())

    // Create and verify a test user directly in DB
    const db = testApp.module.get(DRIZZLE)
    const argon2 = await import('argon2')
    const hashedPassword = await argon2.hash('password123', { type: argon2.argon2id })

    await db.insert(users).values({
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Test User',
      emailVerified: true,
    })

    // Get access token via sign-in
    const signInResponse = await request
      .post('/api/v1/auth/sign-in')
      .send({ email: 'user@example.com', password: 'password123' })

    accessToken = signInResponse.body.data.accessToken
  }, 60000)

  afterAll(async () => {
    await testApp?.cleanup()
  })

  describe('GET /api/v1/users/me', () => {
    it('should return current user profile', async () => {
      const response = await request
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('user@example.com')
      expect(response.body.data).not.toHaveProperty('password')
    })

    it('should return 401 without token', async () => {
      await request
        .get('/api/v1/users/me')
        .expect(401)
    })
  })

  describe('PATCH /api/v1/users/me', () => {
    it('should update user name', async () => {
      const response = await request
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Name' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Updated Name')
    })
  })

  describe('GET /api/v1/users (admin)', () => {
    it('should return 403 for non-admin user', async () => {
      await request
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403)
    })
  })
})
