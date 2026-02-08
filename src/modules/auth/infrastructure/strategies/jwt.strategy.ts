import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import type { JwtConfig } from '@/common/config/jwt.config'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const jwtConfig = configService.get<JwtConfig>('jwt')!
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.SECRET,
    })
  }

  validate(payload: { sub: string; email: string; role: string }) {
    return { sub: payload.sub, email: payload.email, role: payload.role }
  }
}
