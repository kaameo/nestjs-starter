export interface HashPort {
  hash(plain: string): Promise<string>
  compare(plain: string, hashed: string): Promise<boolean>
}

export const HASH_PORT = Symbol('HASH_PORT')
