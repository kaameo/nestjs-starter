import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ConflictException, UnauthorizedException } from '@nestjs/common'

import { BusinessException } from '@/common/exceptions/business.exception'
import { AuthService } from '@/modules/auth/domain/services/auth.service'
import { HashPort } from '@/modules/auth/domain/ports/out/hash.port'
import { TokenPort } from '@/modules/auth/domain/ports/out/token.port'
import { MailPort } from '@/modules/auth/domain/ports/out/mail.port'
import { RefreshTokenRepositoryPort } from '@/modules/auth/domain/ports/out/refresh-token-repository.port'
import { UserRepositoryPort } from '@/modules/user/domain/ports/out/user-repository.port'
import { UserModel } from '@/modules/user/domain/models/user.model'

describe('AuthService', () => {
  let authService: AuthService
  let userRepository: UserRepositoryPort
  let hashService: HashPort
  let tokenService: TokenPort
  let mailService: MailPort
  let refreshTokenRepository: RefreshTokenRepositoryPort

  const mockUser = UserModel.create({
    id: 'user-id-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const mockUnverifiedUser = UserModel.create({
    id: 'user-id-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findByEmailWithPassword: vi.fn(),
      findByVerificationToken: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
    }

    hashService = {
      hash: vi.fn().mockResolvedValue('hashed-password'),
      compare: vi.fn().mockResolvedValue(true),
    }

    tokenService = {
      generateAccessToken: vi.fn().mockResolvedValue('access-token'),
      generateRefreshToken: vi.fn().mockResolvedValue('refresh-token'),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    }

    mailService = {
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    }

    refreshTokenRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'rt-id',
        userId: 'user-id-1',
        jti: 'jti-1',
        familyId: 'family-1',
        tokenHash: 'hash',
        replacedByJti: null,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        userAgent: null,
        ip: null,
        createdAt: new Date(),
      }),
      findByJti: vi.fn(),
      revokeByJti: vi.fn().mockResolvedValue(true),
      findByFamilyId: vi.fn(),
      revokeFamilyById: vi.fn(),
      revokeAllByUserId: vi.fn(),
    }

    authService = new AuthService(
      userRepository as any,
      hashService as any,
      tokenService as any,
      mailService as any,
      refreshTokenRepository as any,
    )
  })

  describe('signUp', () => {
    it('should create a user and send verification email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(userRepository.create).mockResolvedValue(mockUser)

      await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })

      expect(hashService.hash).toHaveBeenCalledWith('password123')
      expect(userRepository.create).toHaveBeenCalled()
      expect(mailService.sendVerificationEmail).toHaveBeenCalled()
    })

    it('should throw ConflictException for duplicate email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)

      await expect(
        authService.signUp({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException)
    })
  })

  describe('signIn', () => {
    it('should return token pair for valid credentials', async () => {
      vi.mocked(userRepository.findByEmailWithPassword).mockResolvedValue({
        ...mockUser,
        password: 'hashed-password',
        isEmailVerified: () => true,
        isAdmin: () => false,
      } as any)

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      })

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('should throw UnauthorizedException for wrong password', async () => {
      vi.mocked(userRepository.findByEmailWithPassword).mockResolvedValue({
        ...mockUser,
        password: 'hashed-password',
        isEmailVerified: () => true,
        isAdmin: () => false,
      } as any)
      vi.mocked(hashService.compare).mockResolvedValue(false)

      await expect(
        authService.signIn({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('should throw BusinessException with EMAIL_NOT_VERIFIED for unverified email', async () => {
      vi.mocked(userRepository.findByEmailWithPassword).mockResolvedValue({
        ...mockUnverifiedUser,
        password: 'hashed-password',
        isEmailVerified: () => false,
        isAdmin: () => false,
      } as any)

      await expect(
        authService.signIn({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(BusinessException)

      await expect(
        authService.signIn({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toMatchObject({ errorCode: 'EMAIL_NOT_VERIFIED' })
    })

    it('should throw UnauthorizedException for non-existent user', async () => {
      vi.mocked(userRepository.findByEmailWithPassword).mockResolvedValue(null)

      await expect(
        authService.signIn({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })

  describe('verifyEmail', () => {
    it('should verify email and return token pair', async () => {
      vi.mocked(userRepository.findByVerificationToken).mockResolvedValue(mockUnverifiedUser)
      vi.mocked(userRepository.update).mockResolvedValue(mockUser)

      const result = await authService.verifyEmail('valid-token')

      expect(result).toHaveProperty('accessToken')
      expect(userRepository.update).toHaveBeenCalledWith(mockUnverifiedUser.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      })
    })

    it('should throw BusinessException with TOKEN_INVALID for invalid token', async () => {
      vi.mocked(userRepository.findByVerificationToken).mockResolvedValue(null)

      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(BusinessException)

      await expect(authService.verifyEmail('invalid-token')).rejects.toMatchObject({
        errorCode: 'TOKEN_INVALID',
      })
    })
  })

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUnverifiedUser)
      vi.mocked(userRepository.update).mockResolvedValue(mockUnverifiedUser)

      await authService.resendVerification('test@example.com')

      expect(mailService.sendVerificationEmail).toHaveBeenCalled()
    })

    it('should silently return for non-existent email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null)

      await expect(
        authService.resendVerification('nonexistent@example.com'),
      ).resolves.toBeUndefined()
    })

    it('should silently return for already verified email', async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser)

      await expect(authService.resendVerification('test@example.com')).resolves.toBeUndefined()

      expect(mailService.sendVerificationEmail).not.toHaveBeenCalled()
    })
  })

  describe('refreshToken', () => {
    const storedToken = {
      id: 'rt-id',
      userId: 'user-id-1',
      jti: 'old-jti',
      familyId: 'family-1',
      tokenHash: 'hash',
      replacedByJti: null,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: null,
      ip: null,
      createdAt: new Date(),
    }

    it('should rotate refresh token and return new pair', async () => {
      vi.mocked(tokenService.verifyRefreshToken).mockResolvedValue({
        sub: 'user-id-1',
        jti: 'old-jti',
      })
      vi.mocked(refreshTokenRepository.findByJti).mockResolvedValue(storedToken)
      vi.mocked(refreshTokenRepository.revokeByJti).mockResolvedValue(true)
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

      const result = await authService.refreshToken('valid-refresh-token')

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(refreshTokenRepository.revokeByJti).toHaveBeenCalled()
    })

    it('should revoke token family on reuse detection', async () => {
      vi.mocked(tokenService.verifyRefreshToken).mockResolvedValue({
        sub: 'user-id-1',
        jti: 'old-jti',
      })
      vi.mocked(refreshTokenRepository.findByJti).mockResolvedValue({
        ...storedToken,
        revokedAt: new Date(Date.now() - 60000), // revoked 60s ago (outside grace)
      })
      vi.mocked(refreshTokenRepository.revokeByJti).mockResolvedValue(false)

      await expect(authService.refreshToken('reused-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      )

      expect(refreshTokenRepository.revokeFamilyById).toHaveBeenCalledWith('family-1')
    })
  })

  describe('signOut', () => {
    it('should revoke all user refresh tokens', async () => {
      await authService.signOut('user-id-1')

      expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith('user-id-1')
    })
  })
})
