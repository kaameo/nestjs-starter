import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core'

import { users } from '../../../user/infrastructure/schema/user.schema'

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    jti: varchar('jti', { length: 255 }).notNull().unique(),
    familyId: varchar('family_id', { length: 255 }).notNull(),
    tokenHash: varchar('token_hash', { length: 255 }).notNull(),
    replacedByJti: varchar('replaced_by_jti', { length: 255 }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    userAgent: varchar('user_agent', { length: 500 }),
    ip: varchar('ip', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('refresh_token_user_idx').on(table.userId),
    index('refresh_token_family_idx').on(table.familyId),
  ],
)

export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
