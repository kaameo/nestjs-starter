import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { ValidationError } from 'class-validator'

function flattenValidationErrors(
  errors: ValidationError[],
): Array<{ property: string; constraints: Record<string, string> }> {
  return errors.flatMap((error) => {
    const result: Array<{ property: string; constraints: Record<string, string> }> = []

    if (error.constraints) {
      result.push({
        property: error.property,
        constraints: error.constraints,
      })
    }

    if (error.children?.length) {
      const childErrors = flattenValidationErrors(error.children)
      result.push(
        ...childErrors.map((child) => ({
          ...child,
          property: `${error.property}.${child.property}`,
        })),
      )
    }

    return result
  })
}

export const globalValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (errors: ValidationError[]) => {
    const details = flattenValidationErrors(errors)
    return new BadRequestException({
      message: details,
      error: 'Validation failed',
    })
  },
})
