import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignUpHandler } from './sign-up.handler'
import { SignUpCommand } from './sign-up.command'
import { AuthService } from '../../domain/services/auth.service'

describe('SignUpHandler', () => {
  let handler: SignUpHandler
  let authService: AuthService

  beforeEach(() => {
    authService = {
      signUp: vi.fn(),
    } as any

    handler = new SignUpHandler(authService)
  })

  describe('execute', () => {
    it('should call authService.signUp with command properties', async () => {
      const command = new SignUpCommand('test@example.com', 'password123', 'John Doe')

      vi.mocked(authService.signUp).mockResolvedValue(undefined)

      await handler.execute(command)

      expect(authService.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      })
    })

    it('should not return anything', async () => {
      const command = new SignUpCommand('test@example.com', 'password123', 'Jane Doe')

      vi.mocked(authService.signUp).mockResolvedValue(undefined)

      const result = await handler.execute(command)

      expect(result).toBeUndefined()
    })
  })
})
