import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'crypto'

import type { JwtConfig } from '@/common/config/jwt.config'

import {
  TokenPort,
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../domain/ports/out/token.port'

@Injectable()
export class JwtTokenAdapter implements TokenPort {
  private readonly jwtConfig: JwtConfig

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtConfig = this.configService.get<JwtConfig>('jwt')!
  }

  async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwtService.signAsync(
      { sub: payload.sub, email: payload.email, role: payload.role },
      {
        secret: this.jwtConfig.SECRET,
        expiresIn: this.jwtConfig.EXPIRATION as any,
      },
    )
  }

  async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    const jti = payload.jti || randomUUID()
    return this.jwtService.signAsync(
      { sub: payload.sub, jti },
      {
        secret: this.jwtConfig.REFRESH_SECRET,
        expiresIn: this.jwtConfig.REFRESH_EXPIRATION as any,
      },
    )
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.jwtService.verifyAsync<AccessTokenPayload>(token, {
      secret: this.jwtConfig.SECRET,
    })
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.jwtConfig.REFRESH_SECRET,
    })
  }
}
