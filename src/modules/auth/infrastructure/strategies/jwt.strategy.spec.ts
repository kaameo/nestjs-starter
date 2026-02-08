import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfigService } from '@nestjs/config'
import { JwtStrategy } from './jwt.strategy'

describe('JwtStrategy', () => {
  let strategy: JwtStrategy
  let configService: ConfigService

  const mockJwtConfig = {
    SECRET: 'test-secret',
    EXPIRATION: '15m',
    REFRESH_SECRET: 'test-refresh-secret',
    REFRESH_EXPIRATION: '7d',
  }

  beforeEach(() => {
    configService = {
      get: vi.fn().mockReturnValue(mockJwtConfig),
    } as any

    strategy = new JwtStrategy(configService)
  })

  describe('constructor', () => {
    it('should load jwt config from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('jwt')
    })
  })

  describe('validate', () => {
    it('should return user payload with sub, email, and role', () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      }

      const result = strategy.validate(payload)

      expect(result).toEqual({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'admin',
      })
    })

    it('should handle user role', () => {
      const payload = {
        sub: 'user-456',
        email: 'user@example.com',
        role: 'user',
      }

      const result = strategy.validate(payload)

      expect(result).toEqual({
        sub: 'user-456',
        email: 'user@example.com',
        role: 'user',
      })
    })
  })
})
