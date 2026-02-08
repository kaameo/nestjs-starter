import { describe, it, expect } from 'vitest'
import { ValidationError } from 'class-validator'
import { BadRequestException } from '@nestjs/common'

import { globalValidationPipe } from './validation.pipe'

describe('ValidationPipe', () => {
  describe('flattenValidationErrors', () => {
    it('should flatten simple validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
          children: [],
        },
        {
          property: 'age',
          constraints: {
            isNumber: 'age must be a number',
            min: 'age must be at least 0',
          },
          children: [],
        },
      ]

      const exceptionFactory = (globalValidationPipe as any).exceptionFactory
      const exception = exceptionFactory(errors)

      expect(exception).toBeInstanceOf(BadRequestException)
      const response = exception.getResponse() as { message: unknown }
      expect(response.message).toEqual([
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
            min: 'age must be at least 0',
          },
        },
      ])
    })

    it('should flatten nested validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'address',
          children: [
            {
              property: 'street',
              constraints: {
                isString: 'street must be a string',
              },
              children: [],
            },
            {
              property: 'city',
              constraints: {
                isString: 'city must be a string',
              },
              children: [],
            },
          ],
        },
      ]

      const exceptionFactory = (globalValidationPipe as any).exceptionFactory
      const exception = exceptionFactory(errors)

      const response = exception.getResponse() as { message: unknown }
      expect(response.message).toEqual([
        {
          property: 'address.street',
          constraints: {
            isString: 'street must be a string',
          },
        },
        {
          property: 'address.city',
          constraints: {
            isString: 'city must be a string',
          },
        },
      ])
    })

    it('should handle errors with both constraints and children', () => {
      const errors: ValidationError[] = [
        {
          property: 'user',
          constraints: {
            isObject: 'user must be an object',
          },
          children: [
            {
              property: 'name',
              constraints: {
                isString: 'name must be a string',
              },
              children: [],
            },
          ],
        },
      ]

      const exceptionFactory = (globalValidationPipe as any).exceptionFactory
      const exception = exceptionFactory(errors)

      const response = exception.getResponse() as { message: unknown }
      expect(response.message).toEqual([
        {
          property: 'user',
          constraints: {
            isObject: 'user must be an object',
          },
        },
        {
          property: 'user.name',
          constraints: {
            isString: 'name must be a string',
          },
        },
      ])
    })

    it('should handle deeply nested validation errors', () => {
      const errors: ValidationError[] = [
        {
          property: 'user',
          children: [
            {
              property: 'address',
              children: [
                {
                  property: 'coordinates',
                  children: [
                    {
                      property: 'lat',
                      constraints: {
                        isNumber: 'lat must be a number',
                      },
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]

      const exceptionFactory = (globalValidationPipe as any).exceptionFactory
      const exception = exceptionFactory(errors)

      const response = exception.getResponse() as { message: unknown }
      expect(response.message).toEqual([
        {
          property: 'user.address.coordinates.lat',
          constraints: {
            isNumber: 'lat must be a number',
          },
        },
      ])
    })

    it('should handle errors without children', () => {
      const errors: ValidationError[] = [
        {
          property: 'name',
          constraints: {
            isString: 'name must be a string',
            minLength: 'name must be at least 2 characters',
          },
          children: [],
        },
      ]

      const exceptionFactory = (globalValidationPipe as any).exceptionFactory
      const exception = exceptionFactory(errors)

      const response = exception.getResponse() as { message: unknown }
      expect(response.message).toEqual([
        {
          property: 'name',
          constraints: {
            isString: 'name must be a string',
            minLength: 'name must be at least 2 characters',
          },
        },
      ])
    })
  })

  describe('globalValidationPipe configuration', () => {
    it('should have whitelist enabled', () => {
      expect((globalValidationPipe as any).validatorOptions.whitelist).toBe(true)
    })

    it('should have forbidNonWhitelisted enabled', () => {
      expect((globalValidationPipe as any).validatorOptions.forbidNonWhitelisted).toBe(true)
    })

    it('should have transform enabled', () => {
      expect((globalValidationPipe as any).isTransformEnabled).toBe(true)
    })

    it('should have enableImplicitConversion in transformOptions', () => {
      expect((globalValidationPipe as any).transformOptions.enableImplicitConversion).toBe(true)
    })

    it('should have custom exceptionFactory', () => {
      expect((globalValidationPipe as any).exceptionFactory).toBeTypeOf('function')
    })
  })
})
