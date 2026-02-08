import { TokenPair } from '../../domain/models/token-pair.model'

export class SignInCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly userAgent?: string,
    public readonly ip?: string,
  ) {}
}

export type SignInCommandResult = TokenPair
