import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { FastifyRequest } from 'fastify'
import { MetricsService } from '../metrics.service'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startTime = performance.now()
    const request = context.switchToHttp().getRequest<FastifyRequest>()

    return next.handle().pipe(
      tap({
        next: () => this.recordMetric(request, context, startTime),
        error: () => this.recordMetric(request, context, startTime),
      }),
    )
  }

  private recordMetric(
    request: FastifyRequest,
    context: ExecutionContext,
    startTime: number,
  ): void {
    const response = context.switchToHttp().getResponse()
    const duration = (performance.now() - startTime) / 1000
    const route = request.routeOptions?.url ?? request.url
    const method = request.method
    const statusCode = response.statusCode?.toString() ?? '500'

    this.metricsService.getHttpRequestDuration().observe(
      { method, route, status_code: statusCode },
      duration,
    )
  }
}
