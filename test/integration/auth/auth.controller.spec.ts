import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { CqrsModule } from '@nestjs/cqrs'

import { AuthModule } from '@/modules/auth/auth.module'
import { UserModule } from '@/modules/user/user.module'
import { createTestApp, TestApp } from '../../helpers/test-app.helper'

describe('AuthController (Integration)', () => {
  let testApp: TestApp
  let request: supertest.Agent

  beforeAll(async () => {
    testApp = await createTestApp([AuthModule, UserModule])
    request = supertest(testApp.app.getHttpServer())
  }, 60000)

  afterAll(async () => {
    await testApp?.cleanup()
  })

  describe('POST /api/v1/auth/sign-up', () => {
    it('should register a new user', async () => {
      const response = await request
        .post('/api/v1/auth/sign-up')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.message).toContain('Registration successful')
    })

    it('should return 409 for duplicate email', async () => {
      await request
        .post('/api/v1/auth/sign-up')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Dup User',
        })
        .expect(201)

      const response = await request
        .post('/api/v1/auth/sign-up')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Dup User',
        })
        .expect(409)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for invalid email', async () => {
      const response = await request
        .post('/api/v1/auth/sign-up')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('should return 400 for short password', async () => {
      const response = await request
        .post('/api/v1/auth/sign-up')
        .send({
          email: 'valid@example.com',
          password: 'short',
          name: 'Test User',
        })
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/sign-in', () => {
    it('should return 401 for unverified email', async () => {
      await request
        .post('/api/v1/auth/sign-up')
        .send({
          email: 'unverified@example.com',
          password: 'password123',
          name: 'Unverified',
        })

      const response = await request
        .post('/api/v1/auth/sign-in')
        .send({
          email: 'unverified@example.com',
          password: 'password123',
        })
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('should return 401 for wrong password', async () => {
      const response = await request
        .post('/api/v1/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})
