import { HttpException } from '@nestjs/common'

import { ErrorCode } from '../types/api-response.type'

export class BusinessException extends HttpException {
  readonly errorCode: ErrorCode

  constructor(errorCode: ErrorCode, statusCode: number, message: string) {
    super({ errorCode, message }, statusCode)
    this.errorCode = errorCode
  }
}
