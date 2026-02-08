import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { FastifyRequest } from 'fastify'

import type { JwtConfig } from '@/common/config/jwt.config'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    const jwtConfig = configService.get<JwtConfig>('jwt')!
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: FastifyRequest) => {
          return (request as FastifyRequest & { cookies: Record<string, string> }).cookies?.refresh_token ?? null
        },
        ExtractJwt.fromBodyField('refreshToken'),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.REFRESH_SECRET,
      passReqToCallback: true,
    })
  }

  validate(request: FastifyRequest, payload: { sub: string; jti: string }) {
    const cookies = (request as FastifyRequest & { cookies: Record<string, string> }).cookies
    const refreshToken =
      cookies?.refresh_token ??
      (request.body as Record<string, string>)?.refreshToken

    return {
      sub: payload.sub,
      jti: payload.jti,
      refreshToken,
    }
  }
}
