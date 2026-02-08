import { ExecutionContext, CallHandler } from '@nestjs/common'
import { of } from 'rxjs'
import { lastValueFrom } from 'rxjs'
import { HttpMetricsInterceptor } from './http-metrics.interceptor'
import { MetricsService } from '../metrics.service'

describe('HttpMetricsInterceptor', () => {
  let interceptor: HttpMetricsInterceptor
  let observeFn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    observeFn = vi.fn()
    const metricsService = {
      getHttpRequestDuration: vi.fn().mockReturnValue({ observe: observeFn }),
    } as unknown as MetricsService

    interceptor = new HttpMetricsInterceptor(metricsService)
  })

  const createMockContext = (method = 'GET', url = '/test', statusCode = 200) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          url,
          routeOptions: { url },
        }),
        getResponse: () => ({ statusCode }),
      }),
    } as unknown as ExecutionContext
  }

  const createMockCallHandler = (response: unknown = {}): CallHandler => ({
    handle: () => of(response),
  })

  it('should observe histogram on successful request', async () => {
    const context = createMockContext('GET', '/api/users', 200)
    const next = createMockCallHandler()

    await lastValueFrom(interceptor.intercept(context, next))

    expect(observeFn).toHaveBeenCalledWith(
      { method: 'GET', route: '/api/users', status_code: '200' },
      expect.any(Number),
    )
  })

  it('should record duration as positive number', async () => {
    const context = createMockContext()
    const next = createMockCallHandler()

    await lastValueFrom(interceptor.intercept(context, next))

    const duration = observeFn.mock.calls[0][1]
    expect(duration).toBeGreaterThanOrEqual(0)
  })

  it('should use route pattern from routeOptions', async () => {
    const context = createMockContext('POST', '/api/users/:id', 201)
    const next = createMockCallHandler()

    await lastValueFrom(interceptor.intercept(context, next))

    expect(observeFn).toHaveBeenCalledWith(
      expect.objectContaining({ route: '/api/users/:id' }),
      expect.any(Number),
    )
  })
})
