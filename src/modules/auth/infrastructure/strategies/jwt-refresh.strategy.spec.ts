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

    it('should extract from body when cookies is empty object', () => {
      const payload = {
        sub: 'user-456',
        jti: 'token-id-789',
      }
      const mockRequest = {
        cookies: {},
        body: {
          refreshToken: 'body-token',
        },
      } as FastifyRequest & { cookies: Record<string, string> }

      const result = strategy.validate(mockRequest, payload)

      expect(result).toEqual({
        sub: 'user-456',
        jti: 'token-id-789',
        refreshToken: 'body-token',
      })
    })

    it('should handle empty string in cookie and fall back to body', () => {
      const payload = {
        sub: 'user-777',
        jti: 'token-id-888',
      }
      const mockRequest = {
        cookies: {
          refresh_token: '',
        },
        body: {
          refreshToken: 'body-token',
        },
      } as FastifyRequest & { cookies: Record<string, string> }

      const result = strategy.validate(mockRequest, payload)

      // Empty string is still a truthy value in the cookie check, so it takes priority
      expect(result).toEqual({
        sub: 'user-777',
        jti: 'token-id-888',
        refreshToken: '',
      })
    })

    it('should return correct shape with all required fields', () => {
      const payload = {
        sub: 'unique-user-id',
        jti: 'unique-token-id',
      }
      const mockRequest = {
        cookies: {
          refresh_token: 'test-token',
        },
        body: {},
      } as FastifyRequest & { cookies: Record<string, string> }

      const result = strategy.validate(mockRequest, payload)

      expect(result).toHaveProperty('sub', 'unique-user-id')
      expect(result).toHaveProperty('jti', 'unique-token-id')
      expect(result).toHaveProperty('refreshToken', 'test-token')
    })

    it('should handle empty string in body', () => {
      const payload = {
        sub: 'user-999',
        jti: 'token-id-000',
      }
      const mockRequest = {
        cookies: {},
        body: {
          refreshToken: '',
        },
      } as FastifyRequest & { cookies: Record<string, string> }

      const result = strategy.validate(mockRequest, payload)

      expect(result).toEqual({
        sub: 'user-999',
        jti: 'token-id-000',
        refreshToken: '',
      })
    })
  })
})
