import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfigService } from '@nestjs/config'
import type { FastifyRequest } from 'fastify'
import { JwtRefreshStrategy } from './jwt-refresh.strategy'

describe('JwtRefreshStrategy', () => {
  let strategy: JwtRefreshStrategy
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

    strategy = new JwtRefreshStrategy(configService)
  })

  describe('constructor', () => {
    it('should load jwt config from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('jwt')
    })
  })

  describe('validate', () => {
    it('should return payload with refreshToken from cookies', () => {
      const payload = {
        sub: 'user-123',
        jti: 'token-id',
      }
      const mockRequest = {
        cookies: {
          refresh_token: 'refresh-token-from-cookie',
        },
        body: {},
      } as FastifyRequest & { cookies: Record<string, string> }

      const result = strategy.validate(mockRequest, payload)

      expect(result).toEqual({
        sub: 'user-123',
        jti: 'token-id',
        refreshToken: 'refresh-token-from-cookie',
      })
    })

    it('should return payload with refreshToken from body when cookies not available', () => {
      const payload = {
        sub: 'user-123',
        jti: 'token-id',
      }
      const mockRequest = {
        cookies: undefined,
        body: {
          refreshToken: 'refresh-token-from-body',
        },
      } as FastifyRequest & { cookies: Record<string, string> }

      const result = strategy.validate(mockRequest, payload)

      expect(result).toEqual({
        sub: 'user-123',
        jti: 'token-id',
        refreshToken: 'refresh-token-from-body',
      })
    })

    it('should prioritize cookie over body', () => {
      const payload = {
        sub: 'user-123',
        jti: 'token-id',
      }
      const mockRequest = {
        cookies: {
          refresh_token: 'refresh-token-from-cookie',
        },
        body: {
          refreshToken: 'refresh-token-from-body',
        },
      } as FastifyRequest & { cookies: Record<string, string> }

      const result = strategy.validate(mockRequest, payload)

      expect(result).toEqual({
        sub: 'user-123',
        jti: 'token-id',
        refreshToken: 'refresh-token-from-cookie',
      })
    })

    it('should handle missing refreshToken gracefully', () => {
      const payload = {
        sub: 'user-123',
        jti: 'token-id',
      }
      const mockRequest = {
        cookies: undefined,
        body: {},
      } as FastifyRequest & { cookies: Record<string, string> }

      const result = strategy.validate(mockRequest, payload)

      expect(result).toEqual({
        sub: 'user-123',
        jti: 'token-id',
        refreshToken: undefined,
      })
    })
  })
})
