import { TokenPair } from '../../domain/models/token-pair.model'

export class RefreshTokenCommand {
  constructor(
    public readonly refreshToken: string,
    public readonly userAgent?: string,
    public readonly ip?: string,
  ) {}
}

export type RefreshTokenCommandResult = TokenPair
