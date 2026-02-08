import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignInHandler } from './sign-in.handler'
import { SignInCommand } from './sign-in.command'
import { AuthService } from '../../domain/services/auth.service'
import type { TokenPair } from '../../domain/models/token-pair.model'

describe('SignInHandler', () => {
  let handler: SignInHandler
  let authService: AuthService

  beforeEach(() => {
    authService = {
      signIn: vi.fn(),
    } as any

    handler = new SignInHandler(authService)
  })

  describe('execute', () => {
    it('should call authService.signIn with command properties', async () => {
      const command = new SignInCommand(
        'test@example.com',
        'password123',
        'Mozilla/5.0',
        '192.168.1.1',
      )
      const expectedTokenPair: TokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      vi.mocked(authService.signIn).mockResolvedValue(expectedTokenPair)

      const result = await handler.execute(command)

      expect(authService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        userAgent: 'Mozilla/5.0',
        ip: '192.168.1.1',
      })
      expect(result).toEqual(expectedTokenPair)
    })

    it('should handle optional userAgent and ip', async () => {
      const command = new SignInCommand('test@example.com', 'password123')
      const expectedTokenPair: TokenPair = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }

      vi.mocked(authService.signIn).mockResolvedValue(expectedTokenPair)

      const result = await handler.execute(command)

      expect(authService.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        userAgent: undefined,
        ip: undefined,
      })
      expect(result).toEqual(expectedTokenPair)
    })
  })
})
