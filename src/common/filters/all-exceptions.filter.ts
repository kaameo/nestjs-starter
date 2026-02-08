import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'

import { BusinessException } from '../exceptions/business.exception'
import { ApiErrorResponse, ErrorCode } from '../types/api-response.type'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    const { status, errorResponse } = this.buildErrorResponse(exception)

    this.logger.error(
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        error: errorResponse.error,
      },
      `${request.method} ${request.url} ${status}`,
    )

    void response.status(status).send(errorResponse)
  }

  private buildErrorResponse(exception: unknown): {
    status: number
    errorResponse: ApiErrorResponse
  } {
    if (exception instanceof BusinessException) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      return {
        status,
        errorResponse: {
          success: false,
          error: {
            code: exception.errorCode,
            message: this.extractMessage(exceptionResponse),
            details: null,
          },
        },
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (this.isValidationError(exceptionResponse)) {
        return {
          status,
          errorResponse: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: this.extractValidationDetails(exceptionResponse),
            },
          },
        }
      }

      return {
        status,
        errorResponse: {
          success: false,
          error: {
            code: this.mapStatusToErrorCode(status),
            message: this.extractMessage(exceptionResponse),
            details: null,
          },
        },
      }
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception)

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorResponse: {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null,
        },
      },
    }
  }

  private isValidationError(
    response: unknown,
  ): response is { message: Array<{ property: string; constraints: Record<string, string> }> } {
    return (
      typeof response === 'object' &&
      response !== null &&
      'message' in response &&
      Array.isArray((response as { message: unknown }).message) &&
      (response as { message: unknown[] }).message.length > 0 &&
      typeof (response as { message: unknown[] }).message[0] === 'object'
    )
  }

  private extractValidationDetails(response: {
    message: Array<{ property: string; constraints: Record<string, string> }>
  }): object {
    return response.message.map((detail) => ({
      property: detail.property,
      constraints: detail.constraints,
    }))
  }

  private extractMessage(response: unknown): string {
    if (typeof response === 'string') {
      return response
    }
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const msg = (response as { message: unknown }).message
      if (typeof msg === 'string') {
        return msg
      }
    }
    return 'An error occurred'
  }

  private mapStatusToErrorCode(status: number): ErrorCode {
    const statusMap: Record<number, ErrorCode> = {
      [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
    }
    return statusMap[status] ?? 'INTERNAL_ERROR'
  }
}
