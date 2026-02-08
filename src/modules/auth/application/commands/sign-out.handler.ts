import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { AuthService } from '../../domain/services/auth.service'
import { SignOutCommand } from './sign-out.command'

@CommandHandler(SignOutCommand)
export class SignOutHandler implements ICommandHandler<SignOutCommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: SignOutCommand): Promise<void> {
    await this.authService.signOut(command.userId)
  }
}
