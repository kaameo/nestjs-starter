import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignOutHandler } from './sign-out.handler'
import { SignOutCommand } from './sign-out.command'
import { AuthService } from '../../domain/services/auth.service'

describe('SignOutHandler', () => {
  let handler: SignOutHandler
  let authService: AuthService

  beforeEach(() => {
    authService = {
      signOut: vi.fn(),
    } as any

    handler = new SignOutHandler(authService)
  })

  describe('execute', () => {
    it('should call authService.signOut with userId', async () => {
      const command = new SignOutCommand('user-123')

      vi.mocked(authService.signOut).mockResolvedValue(undefined)

      await handler.execute(command)

      expect(authService.signOut).toHaveBeenCalledWith('user-123')
    })

    it('should not return anything', async () => {
      const command = new SignOutCommand('user-456')

      vi.mocked(authService.signOut).mockResolvedValue(undefined)

      const result = await handler.execute(command)

      expect(result).toBeUndefined()
    })
  })
})
