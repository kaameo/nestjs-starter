import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { AuthService } from '../../domain/services/auth.service'
import { ResendVerificationCommand } from './resend-verification.command'

@CommandHandler(ResendVerificationCommand)
export class ResendVerificationHandler
  implements ICommandHandler<ResendVerificationCommand>
{
  constructor(private readonly authService: AuthService) {}

  async execute(command: ResendVerificationCommand): Promise<void> {
    await this.authService.resendVerification(command.email)
  }
}
