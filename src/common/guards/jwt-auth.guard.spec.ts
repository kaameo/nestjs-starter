import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { JwtAuthGuard } from './jwt-auth.guard'
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard
  let mockReflector: Partial<Reflector>
  let mockExecutionContext: Partial<ExecutionContext>

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    }

    mockExecutionContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(),
    }

    guard = new JwtAuthGuard(mockReflector as Reflector)
  })

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(true)

      const result = guard.canActivate(mockExecutionContext as ExecutionContext)

      expect(result).toBe(true)
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ])
    })

    it('should call super.canActivate for non-public routes', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false)

      const superCanActivateSpy = vi.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      )
      superCanActivateSpy.mockReturnValue(true)

      guard.canActivate(mockExecutionContext as ExecutionContext)

      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext)

      superCanActivateSpy.mockRestore()
    })

    it('should call super.canActivate when IS_PUBLIC_KEY is not set', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(undefined)

      const superCanActivateSpy = vi.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      )
      superCanActivateSpy.mockReturnValue(true)

      guard.canActivate(mockExecutionContext as ExecutionContext)

      expect(superCanActivateSpy).toHaveBeenCalledWith(mockExecutionContext)

      superCanActivateSpy.mockRestore()
    })

    it('should return result from super.canActivate for non-public routes', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(false)

      const superCanActivateSpy = vi.spyOn(
        Object.getPrototypeOf(JwtAuthGuard.prototype),
        'canActivate',
      )
      const expectedResult = Promise.resolve(true)
      superCanActivateSpy.mockReturnValue(expectedResult)

      const result = guard.canActivate(mockExecutionContext as ExecutionContext)

      expect(result).toBe(expectedResult)

      superCanActivateSpy.mockRestore()
    })
  })
})
