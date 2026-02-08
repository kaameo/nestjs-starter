import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { TokenPair } from '../../domain/models/token-pair.model'
import { AuthService } from '../../domain/services/auth.service'
import { VerifyEmailCommand } from './verify-email.command'

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, TokenPair> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: VerifyEmailCommand): Promise<TokenPair> {
    return this.authService.verifyEmail(command.token)
  }
}
