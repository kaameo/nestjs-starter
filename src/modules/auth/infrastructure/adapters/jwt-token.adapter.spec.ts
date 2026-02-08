import { describe, it, expect, vi, beforeEach } from 'vitest'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { JwtTokenAdapter } from './jwt-token.adapter'
import type { AccessTokenPayload, RefreshTokenPayload } from '../../domain/ports/out/token.port'

describe('JwtTokenAdapter', () => {
  let adapter: JwtTokenAdapter
  let jwtService: JwtService
  let configService: ConfigService

  const mockJwtConfig = {
    SECRET: 'test-secret',
    EXPIRATION: '15m',
    REFRESH_SECRET: 'test-refresh-secret',
    REFRESH_EXPIRATION: '7d',
  }

  beforeEach(() => {
    jwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    } as any

    configService = {
      get: vi.fn().mockReturnValue(mockJwtConfig),
    } as any

    adapter = new JwtTokenAdapter(jwtService, configService)
  })

  describe('constructor', () => {
    it('should load jwt config from ConfigService', () => {
      expect(configService.get).toHaveBeenCalledWith('jwt')
    })
  })

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload and options', async () => {
      const payload: AccessTokenPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      }
      const expectedToken = 'access-token'

      vi.mocked(jwtService.signAsync).mockResolvedValue(expectedToken)

      const result = await adapter.generateAccessToken(payload)

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: payload.sub, email: payload.email, role: payload.role },
        {
          secret: mockJwtConfig.SECRET,
          expiresIn: mockJwtConfig.EXPIRATION,
        },
      )
      expect(result).toBe(expectedToken)
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate refresh token with provided jti', async () => {
      const payload: RefreshTokenPayload = {
        sub: 'user-123',
        jti: 'existing-jti',
      }
      const expectedToken = 'refresh-token'

      vi.mocked(jwtService.signAsync).mockResolvedValue(expectedToken)

      const result = await adapter.generateRefreshToken(payload)

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: payload.sub, jti: 'existing-jti' },
        {
          secret: mockJwtConfig.REFRESH_SECRET,
          expiresIn: mockJwtConfig.REFRESH_EXPIRATION,
        },
      )
      expect(result).toBe(expectedToken)
    })

    it('should generate refresh token with new jti when not provided', async () => {
      const payload: RefreshTokenPayload = {
        sub: 'user-123',
      }
      const expectedToken = 'refresh-token'

      vi.mocked(jwtService.signAsync).mockResolvedValue(expectedToken)

      const result = await adapter.generateRefreshToken(payload)

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: payload.sub,
          jti: expect.any(String),
        }),
        {
          secret: mockJwtConfig.REFRESH_SECRET,
          expiresIn: mockJwtConfig.REFRESH_EXPIRATION,
        },
      )
      expect(result).toBe(expectedToken)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify access token with correct secret', async () => {
      const token = 'valid-access-token'
      const expectedPayload: AccessTokenPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      }

      vi.mocked(jwtService.verifyAsync).mockResolvedValue(expectedPayload)

      const result = await adapter.verifyAccessToken(token)

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: mockJwtConfig.SECRET,
      })
      expect(result).toEqual(expectedPayload)
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify refresh token with correct secret', async () => {
      const token = 'valid-refresh-token'
      const expectedPayload: RefreshTokenPayload = {
        sub: 'user-123',
        jti: 'token-id',
      }

      vi.mocked(jwtService.verifyAsync).mockResolvedValue(expectedPayload)

      const result = await adapter.verifyRefreshToken(token)

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        secret: mockJwtConfig.REFRESH_SECRET,
      })
      expect(result).toEqual(expectedPayload)
    })
  })
})
