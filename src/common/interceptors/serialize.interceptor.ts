import { UseInterceptors, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, map } from 'rxjs'
import { plainToInstance } from 'class-transformer'

interface ClassConstructor {
  new (...args: unknown[]): object
}

export function Serialize(dto: ClassConstructor) {
  return UseInterceptors(new SerializeInterceptor(dto))
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly dto: ClassConstructor) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return data.map((item) =>
            plainToInstance(this.dto, item, {
              excludeExtraneousValues: true,
            }),
          )
        }

        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        })
      }),
    )
  }
}
