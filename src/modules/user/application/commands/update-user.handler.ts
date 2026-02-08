import { Inject, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { UserModel } from '../../domain/models/user.model'
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../domain/ports/out/user-repository.port'
import { UpdateUserCommand } from './update-user.command'

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand, UserModel> {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: UpdateUserCommand): Promise<UserModel> {
    const user = await this.userRepository.findById(command.userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    return this.userRepository.update(command.userId, command.data)
  }
}
