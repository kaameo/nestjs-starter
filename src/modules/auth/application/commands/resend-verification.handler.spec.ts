import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ResendVerificationHandler } from './resend-verification.handler'
import { ResendVerificationCommand } from './resend-verification.command'
import { AuthService } from '../../domain/services/auth.service'

describe('ResendVerificationHandler', () => {
  let handler: ResendVerificationHandler
  let authService: AuthService

  beforeEach(() => {
    authService = {
      resendVerification: vi.fn(),
    } as any

    handler = new ResendVerificationHandler(authService)
  })

  describe('execute', () => {
    it('should call authService.resendVerification with email', async () => {
      const command = new ResendVerificationCommand('test@example.com')

      vi.mocked(authService.resendVerification).mockResolvedValue(undefined)

      await handler.execute(command)

      expect(authService.resendVerification).toHaveBeenCalledWith('test@example.com')
    })

    it('should not return anything', async () => {
      const command = new ResendVerificationCommand('user@example.com')

      vi.mocked(authService.resendVerification).mockResolvedValue(undefined)

      const result = await handler.execute(command)

      expect(result).toBeUndefined()
    })
  })
})
