import { describe, it, expect } from 'vitest'
import { of } from 'rxjs'
import { lastValueFrom } from 'rxjs'

import { ResponseInterceptor } from '@/common/interceptors/response.interceptor'

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor()

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as any

  it('should wrap response in success format', async () => {
    const mockHandler = {
      handle: () => of({ id: 1, name: 'test' }),
    }

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, mockHandler),
    )

    expect(result).toEqual({
      success: true,
      data: { id: 1, name: 'test' },
    })
  })

  it('should handle null response', async () => {
    const mockHandler = {
      handle: () => of(null),
    }

    const result = await lastValueFrom(
      interceptor.intercept(mockExecutionContext, mockHandler),
    )

    expect(result).toEqual({
      success: true,
      data: null,
    })
  })
})
