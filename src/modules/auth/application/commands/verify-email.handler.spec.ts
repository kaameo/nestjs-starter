import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VerifyEmailHandler } from './verify-email.handler'
import { VerifyEmailCommand } from './verify-email.command'
import { AuthService } from '../../domain/services/auth.service'
import type { TokenPair } from '../../domain/models/token-pair.model'

describe('VerifyEmailHandler', () => {
  let handler: VerifyEmailHandler
  let authService: AuthService

  beforeEach(() => {
    authService = {
      verifyEmail: vi.fn(),
    } as any

    handler = new VerifyEmailHandler(authService)
  })

  describe('execute', () => {
    it('should call authService.verifyEmail with token', async () => {
      const command = new VerifyEmailCommand('verification-token-123')
      const expectedTokenPair: TokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      vi.mocked(authService.verifyEmail).mockResolvedValue(expectedTokenPair)

      const result = await handler.execute(command)

      expect(authService.verifyEmail).toHaveBeenCalledWith('verification-token-123')
      expect(result).toEqual(expectedTokenPair)
    })
  })
})
