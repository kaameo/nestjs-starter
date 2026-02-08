import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { RolesGuard } from './roles.guard'
import { ROLES_KEY } from '../decorators/roles.decorator'

describe('RolesGuard', () => {
  let guard: RolesGuard
  let mockReflector: Partial<Reflector>
  let mockExecutionContext: Partial<ExecutionContext>
  let mockRequest: { user?: { role: string } }

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    }

    mockRequest = {}

    mockExecutionContext = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
    }

    guard = new RolesGuard(mockReflector as Reflector)
  })

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(undefined)

      const result = guard.canActivate(mockExecutionContext as ExecutionContext)

      expect(result).toBe(true)
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ])
    })

    it('should return true when user has the required role', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(['admin'])
      mockRequest.user = { role: 'admin' }

      const result = guard.canActivate(mockExecutionContext as ExecutionContext)

      expect(result).toBe(true)
    })

    it('should return true when user has one of the required roles', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(['admin', 'moderator'])
      mockRequest.user = { role: 'moderator' }

      const result = guard.canActivate(mockExecutionContext as ExecutionContext)

      expect(result).toBe(true)
    })

    it('should throw ForbiddenException when user does not have the required role', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(['admin'])
      mockRequest.user = { role: 'user' }

      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        ForbiddenException,
      )
      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        'Insufficient permissions',
      )
    })

    it('should throw ForbiddenException when user does not have any of the required roles', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(['admin', 'moderator'])
      mockRequest.user = { role: 'user' }

      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        ForbiddenException,
      )
      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        'Insufficient permissions',
      )
    })

    it('should throw ForbiddenException when user is not present in request', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(['admin'])
      mockRequest.user = undefined

      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        ForbiddenException,
      )
      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        'Access denied',
      )
    })

    it('should throw ForbiddenException when request has no user property', () => {
      vi.mocked(mockReflector.getAllAndOverride).mockReturnValue(['admin'])
      delete mockRequest.user

      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        ForbiddenException,
      )
      expect(() => guard.canActivate(mockExecutionContext as ExecutionContext)).toThrow(
        'Access denied',
      )
    })
  })
})
