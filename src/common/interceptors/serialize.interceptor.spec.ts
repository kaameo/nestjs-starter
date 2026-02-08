import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExecutionContext, CallHandler } from '@nestjs/common'
import { of } from 'rxjs'
import { firstValueFrom } from 'rxjs'
import { Expose } from 'class-transformer'

import { SerializeInterceptor } from './serialize.interceptor'

class TestDto {
  @Expose()
  id!: number

  @Expose()
  name!: string

  password?: string
}

describe('SerializeInterceptor', () => {
  let interceptor: SerializeInterceptor
  let mockExecutionContext: Partial<ExecutionContext>
  let mockCallHandler: Partial<CallHandler>

  beforeEach(() => {
    interceptor = new SerializeInterceptor(TestDto)

    mockExecutionContext = {
      switchToHttp: vi.fn(),
    }

    mockCallHandler = {
      handle: vi.fn(),
    }
  })

  describe('intercept', () => {
    it('should transform single object using plainToInstance', async () => {
      const inputData = {
        id: 1,
        name: 'John Doe',
        password: 'secret123',
        extraField: 'should be excluded',
      }

      vi.mocked(mockCallHandler.handle).mockReturnValue(of(inputData))

      const result = await firstValueFrom(
        interceptor.intercept(
          mockExecutionContext as ExecutionContext,
          mockCallHandler as CallHandler,
        ),
      )

      expect(result).toHaveProperty('id', 1)
      expect(result).toHaveProperty('name', 'John Doe')
      expect(result).not.toHaveProperty('extraField')
    })

    it('should transform array of objects', async () => {
      const inputData = [
        {
          id: 1,
          name: 'John Doe',
          password: 'secret123',
          extraField: 'excluded',
        },
        {
          id: 2,
          name: 'Jane Smith',
          password: 'secret456',
          extraField: 'excluded',
        },
      ]

      vi.mocked(mockCallHandler.handle).mockReturnValue(of(inputData))

      const result = await firstValueFrom(
        interceptor.intercept(
          mockExecutionContext as ExecutionContext,
          mockCallHandler as CallHandler,
        ),
      )

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('id', 1)
      expect(result[0]).toHaveProperty('name', 'John Doe')
      expect(result[0]).not.toHaveProperty('extraField')
      expect(result[1]).toHaveProperty('id', 2)
      expect(result[1]).toHaveProperty('name', 'Jane Smith')
      expect(result[1]).not.toHaveProperty('extraField')
    })

    it('should handle empty array', async () => {
      vi.mocked(mockCallHandler.handle).mockReturnValue(of([]))

      const result = await firstValueFrom(
        interceptor.intercept(
          mockExecutionContext as ExecutionContext,
          mockCallHandler as CallHandler,
        ),
      )

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('should handle null values', async () => {
      vi.mocked(mockCallHandler.handle).mockReturnValue(of(null))

      const result = await firstValueFrom(
        interceptor.intercept(
          mockExecutionContext as ExecutionContext,
          mockCallHandler as CallHandler,
        ),
      )

      expect(result).toBeNull()
    })

    it('should use excludeExtraneousValues option', async () => {
      const inputData = {
        id: 1,
        name: 'John Doe',
        internalField: 'should not appear',
      }

      vi.mocked(mockCallHandler.handle).mockReturnValue(of(inputData))

      const result = await firstValueFrom(
        interceptor.intercept(
          mockExecutionContext as ExecutionContext,
          mockCallHandler as CallHandler,
        ),
      )

      expect(result).toHaveProperty('id', 1)
      expect(result).toHaveProperty('name', 'John Doe')
      expect(result).not.toHaveProperty('internalField')
    })
  })
})
