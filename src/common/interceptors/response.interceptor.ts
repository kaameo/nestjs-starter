import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, map } from 'rxjs'
import { ApiSuccessResponse } from '../types/api-response.type'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (this.isAlreadyWrapped(data)) {
          return data as unknown as ApiSuccessResponse<T>
        }

        if (this.hasPaginationMeta(data)) {
          const { data: items, meta } = data as unknown as { data: unknown; meta: unknown }
          return {
            success: true as const,
            data: items as T,
            meta: meta as ApiSuccessResponse<T>['meta'],
          }
        }

        return {
          success: true as const,
          data,
        }
      }),
    )
  }

  private isAlreadyWrapped(data: unknown): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'success' in data &&
      typeof (data as { success: unknown }).success === 'boolean'
    )
  }

  private hasPaginationMeta(data: unknown): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'data' in data &&
      'meta' in data &&
      typeof (data as { meta: unknown }).meta === 'object'
    )
  }
}
