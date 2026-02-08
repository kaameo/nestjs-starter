import { describe, it, expect } from 'vitest'

import { Argon2HashAdapter } from '@/modules/auth/infrastructure/adapters/argon2-hash.adapter'

describe('Argon2HashAdapter', () => {
  const adapter = new Argon2HashAdapter()

  it('should hash a password', async () => {
    const hash = await adapter.hash('password123')

    expect(hash).toBeDefined()
    expect(hash).not.toBe('password123')
  })

  it('should verify correct password', async () => {
    const hash = await adapter.hash('password123')
    const isValid = await adapter.compare('password123', hash)

    expect(isValid).toBe(true)
  })

  it('should reject wrong password', async () => {
    const hash = await adapter.hash('password123')
    const isValid = await adapter.compare('wrong-password', hash)

    expect(isValid).toBe(false)
  })
})
