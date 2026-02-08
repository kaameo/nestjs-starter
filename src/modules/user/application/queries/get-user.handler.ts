import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../domain/ports/out/user-repository.port'
import { UserModel } from '../../domain/models/user.model'
import { GetUserQuery } from './get-user.query'
import { NotFoundException } from '@nestjs/common'

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserModel> {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(query: GetUserQuery): Promise<UserModel> {
    const user = await this.userRepository.findById(query.userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }
}
