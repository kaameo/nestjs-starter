import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'

import { AllExceptionsFilter } from './all-exceptions.filter'
import { BusinessException } from '../exceptions/business.exception'

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter
  let mockResponse: Partial<FastifyReply>
  let mockRequest: Partial<FastifyRequest>
  let mockArgumentsHost: Partial<ArgumentsHost>

  beforeEach(() => {
    filter = new AllExceptionsFilter()

    const statusFn = vi.fn().mockReturnThis()
    const sendFn = vi.fn()

    mockResponse = {
      status: statusFn,
      send: sendFn,
    }

    mockRequest = {
      url: '/test/path',
      method: 'GET',
    }

    mockArgumentsHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    }
  })

  describe('catch', () => {
    it('should handle BusinessException correctly', () => {
      const exception = new BusinessException(
        'USER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
        'User not found',
      )

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          details: null,
        },
      })
    })

    it('should handle HttpException with validation errors', () => {
      const validationErrors = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        },
        {
          property: 'age',
          constraints: {
            isNumber: 'age must be a number',
          },
        },
      ]

      const exception = new HttpException(
        {
          message: validationErrors,
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      )

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: validationErrors,
        },
      })
    })

    it('should handle regular HttpException with string message', () => {
      const exception = new HttpException('Unauthorized access', HttpStatus.UNAUTHORIZED)

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized access',
          details: null,
        },
      })
    })

    it('should handle regular HttpException with object message', () => {
      const exception = new HttpException(
        {
          message: 'Resource not found',
          error: 'Not Found',
        },
        HttpStatus.NOT_FOUND,
      )

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: null,
        },
      })
    })

    it('should handle HttpException with FORBIDDEN status', () => {
      const exception = new HttpException('Access forbidden', HttpStatus.FORBIDDEN)

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access forbidden',
          details: null,
        },
      })
    })

    it('should handle HttpException with CONFLICT status', () => {
      const exception = new HttpException('Resource conflict', HttpStatus.CONFLICT)

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'Resource conflict',
          details: null,
        },
      })
    })

    it('should handle HttpException with TOO_MANY_REQUESTS status', () => {
      const exception = new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS)

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded',
          details: null,
        },
      })
    })

    it('should handle unknown error', () => {
      const exception = new Error('Unknown error')

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null,
        },
      })
    })

    it('should handle unknown non-Error exception', () => {
      const exception = 'Some string error'

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null,
        },
      })
    })

    it('should handle HttpException with unmapped status code', () => {
      const exception = new HttpException('Teapot error', 418)

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(418)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Teapot error',
          details: null,
        },
      })
    })

    it('should handle validation errors with nested properties', () => {
      const validationErrors = [
        {
          property: 'address',
          constraints: {
            isObject: 'address must be an object',
          },
        },
      ]

      const exception = new HttpException(
        {
          message: validationErrors,
        },
        HttpStatus.BAD_REQUEST,
      )

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              property: 'address',
              constraints: {
                isObject: 'address must be an object',
              },
            },
          ],
        },
      })
    })

    it('should extract message from response object without message property', () => {
      const exception = new HttpException({ error: 'Bad Request' }, HttpStatus.BAD_REQUEST)

      filter.catch(exception, mockArgumentsHost as ArgumentsHost)

      expect(mockResponse.send).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'An error occurred',
          details: null,
        },
      })
    })
  })
})
