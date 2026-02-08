import { TokenPair } from '../../models/token-pair.model'

export interface RefreshTokenUseCase {
  execute(refreshToken: string, userAgent?: string, ip?: string): Promise<TokenPair>
}
