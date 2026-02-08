import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { AuthService } from '../../domain/services/auth.service'
import { SignUpCommand } from './sign-up.command'

@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: SignUpCommand): Promise<void> {
    await this.authService.signUp({
      email: command.email,
      password: command.password,
      name: command.name,
    })
  }
}
