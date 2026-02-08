import { UserModel } from '../../models/user.model'

export interface CreateUserData {
  readonly email: string
  readonly password: string
  readonly name: string
  readonly emailVerificationToken: string
  readonly emailVerificationExpires: Date
}

export interface UpdateUserData {
  readonly name?: string
  readonly email?: string
  readonly password?: string
  readonly emailVerified?: boolean
  readonly emailVerificationToken?: string | null
  readonly emailVerificationExpires?: Date | null
}

export interface PaginationParams {
  readonly page: number
  readonly limit: number
}

export interface UserRepositoryPort {
  findById(id: string): Promise<UserModel | null>
  findByEmail(email: string): Promise<UserModel | null>
  findByEmailWithPassword(email: string): Promise<(UserModel & { password: string }) | null>
  findByVerificationToken(
    token: string,
  ): Promise<(UserModel & { emailVerificationExpires: Date | null }) | null>
  create(data: CreateUserData): Promise<UserModel>
  update(id: string, data: UpdateUserData): Promise<UserModel>
  delete(id: string): Promise<void>
  findAll(pagination: PaginationParams): Promise<{ data: UserModel[]; total: number }>
}

export const USER_REPOSITORY_PORT = Symbol('USER_REPOSITORY_PORT')
