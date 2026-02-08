import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'

import { TokenPair } from '../../domain/models/token-pair.model'
import { AuthService } from '../../domain/services/auth.service'
import { RefreshTokenCommand } from './refresh-token.command'

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand, TokenPair> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: RefreshTokenCommand): Promise<TokenPair> {
    return this.authService.refreshToken(command.refreshToken, command.userAgent, command.ip)
  }
}
