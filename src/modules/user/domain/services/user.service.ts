import { Inject, Injectable, NotFoundException } from '@nestjs/common'

import { PaginationMeta, paginate } from '@/shared/utils/pagination.util'

import { UserModel } from '../models/user.model'
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
  PaginationParams,
} from '../ports/out/user-repository.port'

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async getUser(id: string): Promise<UserModel> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async updateUser(id: string, data: { name?: string }): Promise<UserModel> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    return this.userRepository.update(id, data)
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.userRepository.delete(id)
  }

  async listUsers(
    pagination: PaginationParams,
  ): Promise<{ data: UserModel[]; meta: PaginationMeta }> {
    const { data, total } = await this.userRepository.findAll(pagination)

    return {
      data,
      meta: paginate(total, pagination.page, pagination.limit),
    }
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.userRepository.findByEmail(email)
  }
}
