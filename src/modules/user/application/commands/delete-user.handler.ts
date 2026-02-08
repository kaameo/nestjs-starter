import { Inject, NotFoundException } from '@nestjs/common'
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../domain/ports/out/user-repository.port'
import { DeleteUserCommand } from './delete-user.command'

@CommandHandler(DeleteUserCommand)
export class DeleteUserHandler implements ICommandHandler<DeleteUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.userRepository.delete(command.userId)
  }
}
