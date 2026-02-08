import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RefreshTokenHandler } from './refresh-token.handler'
import { RefreshTokenCommand } from './refresh-token.command'
import { AuthService } from '../../domain/services/auth.service'
import type { TokenPair } from '../../domain/models/token-pair.model'

describe('RefreshTokenHandler', () => {
  let handler: RefreshTokenHandler
  let authService: AuthService

  beforeEach(() => {
    authService = {
      refreshToken: vi.fn(),
    } as any

    handler = new RefreshTokenHandler(authService)
  })

  describe('execute', () => {
    it('should call authService.refreshToken with command properties', async () => {
      const command = new RefreshTokenCommand('old-refresh-token', 'Mozilla/5.0', '192.168.1.1')
      const expectedTokenPair: TokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }

      vi.mocked(authService.refreshToken).mockResolvedValue(expectedTokenPair)

      const result = await handler.execute(command)

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
        'Mozilla/5.0',
        '192.168.1.1',
      )
      expect(result).toEqual(expectedTokenPair)
    })

    it('should handle optional userAgent and ip', async () => {
      const command = new RefreshTokenCommand('old-refresh-token')
      const expectedTokenPair: TokenPair = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      }

      vi.mocked(authService.refreshToken).mockResolvedValue(expectedTokenPair)

      const result = await handler.execute(command)

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
        undefined,
        undefined,
      )
      expect(result).toEqual(expectedTokenPair)
    })
  })
})
