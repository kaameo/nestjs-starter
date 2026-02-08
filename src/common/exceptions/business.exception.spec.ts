import { describe, it, expect } from 'vitest'
import { HttpStatus } from '@nestjs/common'

import { BusinessException } from './business.exception'

describe('BusinessException', () => {
  describe('constructor', () => {
    it('should create exception with errorCode, status, and message', () => {
      const exception = new BusinessException(
        'USER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'User not found',
      )

      expect(exception.errorCode).toBe('USER_NOT_FOUND')
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND)
      expect(exception.message).toBe('User not found')
    })

    it('should set response with errorCode and message', () => {
      const exception = new BusinessException(
        'UNAUTHORIZED',
        HttpStatus.UNAUTHORIZED,
        'Invalid credentials',
      )

      const response = exception.getResponse()

      expect(response).toEqual({
        errorCode: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      })
    })

    it('should handle different error codes', () => {
      const exception1 = new BusinessException(
        'VALIDATION_ERROR',
        HttpStatus.BAD_REQUEST,
        'Invalid input',
      )
      const exception2 = new BusinessException('FORBIDDEN', HttpStatus.FORBIDDEN, 'Access denied')
      const exception3 = new BusinessException(
        'INTERNAL_ERROR',
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Server error',
      )

      expect(exception1.errorCode).toBe('VALIDATION_ERROR')
      expect(exception1.getStatus()).toBe(HttpStatus.BAD_REQUEST)

      expect(exception2.errorCode).toBe('FORBIDDEN')
      expect(exception2.getStatus()).toBe(HttpStatus.FORBIDDEN)

      expect(exception3.errorCode).toBe('INTERNAL_ERROR')
      expect(exception3.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR)
    })

    it('should be an instance of HttpException', () => {
      const exception = new BusinessException(
        'NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'Resource not found',
      )

      expect(exception).toBeInstanceOf(Error)
      expect(exception.name).toBe('BusinessException')
    })

    it('should handle custom error codes', () => {
      const exception = new BusinessException(
        'CUSTOM_ERROR' as any,
        HttpStatus.BAD_REQUEST,
        'Custom error message',
      )

      expect(exception.errorCode).toBe('CUSTOM_ERROR')
      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST)
    })

    it('should preserve errorCode property as readonly', () => {
      const exception = new BusinessException('CONFLICT', HttpStatus.CONFLICT, 'Resource conflict')

      expect(exception.errorCode).toBe('CONFLICT')

      // TypeScript will prevent this at compile time, but at runtime it should still be the original value
      const descriptor = Object.getOwnPropertyDescriptor(exception, 'errorCode')
      expect(descriptor?.writable).toBe(true) // In JavaScript, readonly is a TypeScript concept
    })
  })
})
