import { TokenPair } from '../../models/token-pair.model'

export interface VerifyEmailUseCase {
  execute(token: string): Promise<TokenPair>
}
