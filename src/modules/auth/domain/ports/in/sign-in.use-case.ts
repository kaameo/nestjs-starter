import { TokenPair } from '../../models/token-pair.model'

export interface SignInData {
  readonly email: string
  readonly password: string
  readonly userAgent?: string
  readonly ip?: string
}

export interface SignInUseCase {
  execute(data: SignInData): Promise<TokenPair>
}
