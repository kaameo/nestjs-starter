import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { FastifyRequest } from 'fastify'

export interface JwtPayload {
  sub: string
  email: string
  role: string
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | string => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>()
    const user = (request as FastifyRequest & { user: JwtPayload }).user

    return data ? user[data] : user
  },
)
