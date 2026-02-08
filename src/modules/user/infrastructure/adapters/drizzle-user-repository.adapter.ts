import { Inject, Injectable } from '@nestjs/common'
import { eq, count } from 'drizzle-orm'

import { DRIZZLE, DrizzleDatabase } from '@/database/drizzle.provider'
import { users } from '@/database/schema'

import { UserModel } from '../../domain/models/user.model'
import {
  UserRepositoryPort,
  CreateUserData,
  UpdateUserData,
  PaginationParams,
} from '../../domain/ports/out/user-repository.port'

@Injectable()
export class DrizzleUserRepositoryAdapter implements UserRepositoryPort {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async findById(id: string): Promise<UserModel | null> {
    const [result] = await this.db.select().from(users).where(eq(users.id, id)).limit(1)

    return result ? this.mapToModel(result) : null
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const [result] = await this.db.select().from(users).where(eq(users.email, email)).limit(1)

    return result ? this.mapToModel(result) : null
  }

  async findByEmailWithPassword(email: string): Promise<(UserModel & { password: string }) | null> {
    const [result] = await this.db.select().from(users).where(eq(users.email, email)).limit(1)

    if (!result) return null

    const userModel = this.mapToModel(result)
    return Object.assign(userModel, { password: result.password })
  }

  async findByVerificationToken(
    token: string,
  ): Promise<(UserModel & { emailVerificationExpires: Date | null }) | null> {
    const [result] = await this.db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1)

    if (!result) return null

    const userModel = this.mapToModel(result)
    return Object.assign(userModel, {
      emailVerificationExpires: result.emailVerificationExpires,
    })
  }

  async create(data: CreateUserData): Promise<UserModel> {
    const [result] = await this.db
      .insert(users)
      .values({
        email: data.email,
        password: data.password,
        name: data.name,
        emailVerificationToken: data.emailVerificationToken,
        emailVerificationExpires: data.emailVerificationExpires,
      })
      .returning()

    return this.mapToModel(result)
  }

  async update(id: string, data: UpdateUserData): Promise<UserModel> {
    const updateData: Record<string, unknown> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.password !== undefined) updateData.password = data.password
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified
    if (data.emailVerificationToken !== undefined)
      updateData.emailVerificationToken = data.emailVerificationToken
    if (data.emailVerificationExpires !== undefined)
      updateData.emailVerificationExpires = data.emailVerificationExpires

    const [result] = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning()

    return this.mapToModel(result)
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id))
  }

  async findAll(pagination: PaginationParams): Promise<{ data: UserModel[]; total: number }> {
    const offset = (pagination.page - 1) * pagination.limit

    const [data, [{ total }]] = await Promise.all([
      this.db.select().from(users).limit(pagination.limit).offset(offset).orderBy(users.createdAt),
      this.db.select({ total: count() }).from(users),
    ])

    return {
      data: data.map((row) => this.mapToModel(row)),
      total,
    }
  }

  private mapToModel(row: typeof users.$inferSelect): UserModel {
    return UserModel.create({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      emailVerified: row.emailVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })
  }
}
