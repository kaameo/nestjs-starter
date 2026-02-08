import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { TokenPair } from '../../domain/models/token-pair.model'
import { AuthService } from '../../domain/services/auth.service'
import { SignInCommand } from './sign-in.command'

@CommandHandler(SignInCommand)
export class SignInHandler implements ICommandHandler<SignInCommand, TokenPair> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: SignInCommand): Promise<TokenPair> {
    return this.authService.signIn({
      email: command.email,
      password: command.password,
      userAgent: command.userAgent,
      ip: command.ip,
    })
  }
}
