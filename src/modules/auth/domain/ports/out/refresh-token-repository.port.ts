export interface CreateRefreshTokenData {
  readonly userId: string
  readonly jti: string
  readonly familyId: string
  readonly tokenHash: string
  readonly expiresAt: Date
  readonly userAgent?: string
  readonly ip?: string
}

export interface RefreshTokenEntity {
  readonly id: string
  readonly userId: string
  readonly jti: string
  readonly familyId: string
  readonly tokenHash: string
  readonly replacedByJti: string | null
  readonly revokedAt: Date | null
  readonly expiresAt: Date
  readonly userAgent: string | null
  readonly ip: string | null
  readonly createdAt: Date
}

export interface RefreshTokenRepositoryPort {
  create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity>
  findByJti(jti: string): Promise<RefreshTokenEntity | null>
  revokeByJti(jti: string, replacedByJti: string): Promise<boolean>
  findByFamilyId(familyId: string): Promise<RefreshTokenEntity[]>
  revokeFamilyById(familyId: string): Promise<void>
  revokeAllByUserId(userId: string): Promise<void>
}

export const REFRESH_TOKEN_REPOSITORY_PORT = Symbol('REFRESH_TOKEN_REPOSITORY_PORT')
