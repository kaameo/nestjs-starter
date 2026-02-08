import { Injectable } from '@nestjs/common'
import * as argon2 from 'argon2'

import { HashPort } from '../../domain/ports/out/hash.port'

@Injectable()
export class Argon2HashAdapter implements HashPort {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain, {
      type: argon2.argon2id,
    })
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return argon2.verify(hashed, plain)
  }
}
