import { TokenPair } from '../../domain/models/token-pair.model'

export class VerifyEmailCommand {
  constructor(public readonly token: string) {}
}

export type VerifyEmailCommandResult = TokenPair
