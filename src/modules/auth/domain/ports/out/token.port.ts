export interface AccessTokenPayload {
  readonly sub: string
  readonly email: string
  readonly role: string
}

export interface RefreshTokenPayload {
  readonly sub: string
  readonly jti: string
}

export interface TokenPort {
  generateAccessToken(payload: AccessTokenPayload): Promise<string>
  generateRefreshToken(payload: RefreshTokenPayload): Promise<string>
  verifyAccessToken(token: string): Promise<AccessTokenPayload>
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>
}

export const TOKEN_PORT = Symbol('TOKEN_PORT')
