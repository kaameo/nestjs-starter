import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CommandBus } from '@nestjs/cqrs'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { AuthController } from './auth.controller'
import { SignUpCommand } from '../../application/commands/sign-up.command'
import { SignInCommand } from '../../application/commands/sign-in.command'
import { VerifyEmailCommand } from '../../application/commands/verify-email.command'
import { ResendVerificationCommand } from '../../application/commands/resend-verification.command'
import { RefreshTokenCommand } from '../../application/commands/refresh-token.command'
import { SignOutCommand } from '../../application/commands/sign-out.command'
import type { TokenPair } from '../../domain/models/token-pair.model'

describe('AuthController', () => {
  let controller: AuthController
  let commandBus: CommandBus
  let mockReply: FastifyReply
  let mockRequest: FastifyRequest

  beforeEach(() => {
    commandBus = {
      execute: vi.fn(),
    } as any

    mockReply = {
      setCookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any

    mockRequest = {
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
      ip: '192.168.1.1',
    } as any

    controller = new AuthController(commandBus)
  })

  describe('signUp', () => {
    it('should execute SignUpCommand and return success message', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      }

      vi.mocked(commandBus.execute).mockResolvedValue(undefined)

      const result = await controller.signUp(dto)

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
          name: 'John Doe',
        }),
      )
      expect(result).toEqual({
        message: 'Registration successful. Please verify your email.',
      })
    })
  })

  describe('signIn', () => {
    it('should execute SignInCommand, set cookie, and return tokens', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
      }
      const tokenPair: TokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      vi.mocked(commandBus.execute).mockResolvedValue(tokenPair)

      const result = await controller.signIn(dto, mockRequest, mockReply)

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1',
        }),
      )
      expect(mockReply.setCookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 604800,
      })
      expect(result).toEqual({
        accessToken: 'access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
      })
    })
  })

  describe('verifyEmailPost', () => {
    it('should execute VerifyEmailCommand, set cookie, and return tokens', async () => {
      const dto = {
        token: 'verification-token',
      }
      const tokenPair: TokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      vi.mocked(commandBus.execute).mockResolvedValue(tokenPair)

      const result = await controller.verifyEmailPost(dto, mockReply)

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'verification-token',
        }),
      )
      expect(mockReply.setCookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 604800,
      })
      expect(result).toEqual({
        accessToken: 'access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
      })
    })
  })

  describe('verifyEmailGet', () => {
    it('should execute VerifyEmailCommand with query token, set cookie, and return tokens', async () => {
      const token = 'verification-token-from-query'
      const tokenPair: TokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      vi.mocked(commandBus.execute).mockResolvedValue(tokenPair)

      const result = await controller.verifyEmailGet(token, mockReply)

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'verification-token-from-query',
        }),
      )
      expect(mockReply.setCookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 604800,
      })
      expect(result).toEqual({
        accessToken: 'access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
      })
    })
  })

  describe('resendVerification', () => {
    it('should execute ResendVerificationCommand and return success message', async () => {
      const dto = {
        email: 'test@example.com',
      }

      vi.mocked(commandBus.execute).mockResolvedValue(undefined)

      const result = await controller.resendVerification(dto)

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
        }),
      )
      expect(result).toEqual({
        message: 'If the email exists and is not verified, a verification email has been sent.',
      })
    })
  })

  describe('refresh', () => {
    it('should execute RefreshTokenCommand, set cookie, and return new tokens', async () => {
      const user = {
        sub: 'user-123',
        jti: 'token-id',
        refreshToken: 'old-refresh-token',
      }
      const tokenPair: TokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }

      vi.mocked(commandBus.execute).mockResolvedValue(tokenPair)

      const result = await controller.refresh(user, mockRequest, mockReply)

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          refreshToken: 'old-refresh-token',
          userAgent: 'Mozilla/5.0',
          ip: '192.168.1.1',
        }),
      )
      expect(mockReply.setCookie).toHaveBeenCalledWith('refresh_token', 'new-refresh-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/api/v1/auth/refresh',
        maxAge: 604800,
      })
      expect(result).toEqual({
        accessToken: 'new-access-token',
        tokenType: 'Bearer',
        expiresIn: 900,
      })
    })
  })

  describe('signOut', () => {
    it('should execute SignOutCommand, clear cookie, and return success message', async () => {
      const user = {
        sub: 'user-123',
      }

      vi.mocked(commandBus.execute).mockResolvedValue(undefined)

      const result = await controller.signOut(user, mockReply)

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
        }),
      )
      expect(mockReply.clearCookie).toHaveBeenCalledWith('refresh_token', {
        path: '/api/v1/auth/refresh',
      })
      expect(result).toEqual({
        message: 'Signed out successfully',
      })
    })
  })
})
