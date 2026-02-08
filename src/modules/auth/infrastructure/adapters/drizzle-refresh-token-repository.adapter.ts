import { Inject, Injectable } from '@nestjs/common'
import { and, eq, isNull } from 'drizzle-orm'

import { DRIZZLE, DrizzleDatabase } from '@/database/drizzle.provider'
import { refreshTokens } from '@/database/schema'

import {
  RefreshTokenRepositoryPort,
  CreateRefreshTokenData,
  RefreshTokenEntity,
} from '../../domain/ports/out/refresh-token-repository.port'

@Injectable()
export class DrizzleRefreshTokenRepositoryAdapter implements RefreshTokenRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity> {
    const [result] = await this.db
      .insert(refreshTokens)
      .values({
        userId: data.userId,
        jti: data.jti,
        familyId: data.familyId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent ?? null,
        ip: data.ip ?? null,
      })
      .returning()

    return this.mapToEntity(result)
  }

  async findByJti(jti: string): Promise<RefreshTokenEntity | null> {
    const [result] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.jti, jti))
      .limit(1)

    return result ? this.mapToEntity(result) : null
  }

  async revokeByJti(jti: string, replacedByJti: string): Promise<boolean> {
    const result = await this.db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        replacedByJti,
      })
      .where(and(eq(refreshTokens.jti, jti), isNull(refreshTokens.revokedAt)))
      .returning()

    return result.length > 0
  }

  async findByFamilyId(familyId: string): Promise<RefreshTokenEntity[]> {
    const results = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.familyId, familyId))

    return results.map((r) => this.mapToEntity(r))
  }

  async revokeFamilyById(familyId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.familyId, familyId), isNull(refreshTokens.revokedAt)))
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)))
  }

  private mapToEntity(row: typeof refreshTokens.$inferSelect): RefreshTokenEntity {
    return {
      id: row.id,
      userId: row.userId,
      jti: row.jti,
      familyId: row.familyId,
      tokenHash: row.tokenHash,
      replacedByJti: row.replacedByJti,
      revokedAt: row.revokedAt,
      expiresAt: row.expiresAt,
      userAgent: row.userAgent,
      ip: row.ip,
      createdAt: row.createdAt,
    }
  }
}
