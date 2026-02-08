import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import throttleConfig from './throttle.config'

describe('throttleConfig', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return default values when no env variables are set', () => {
    delete process.env.THROTTLE_TTL
    delete process.env.THROTTLE_LIMIT
    delete process.env.REDIS_HOST
    delete process.env.REDIS_PORT
    delete process.env.NODE_ENV

    const config = throttleConfig()

    expect(config).toEqual({
      TTL: 60000,
      LIMIT: 100,
      REDIS_HOST: undefined,
      REDIS_PORT: undefined,
      redisEnabled: false,
    })
  })

  it('should parse custom TTL value', () => {
    process.env.THROTTLE_TTL = '30000'

    const config = throttleConfig()

    expect(config.TTL).toBe(30000)
  })

  it('should parse custom LIMIT value', () => {
    process.env.THROTTLE_LIMIT = '200'

    const config = throttleConfig()

    expect(config.LIMIT).toBe(200)
  })

  it('should parse REDIS_HOST when provided', () => {
    process.env.REDIS_HOST = 'localhost'

    const config = throttleConfig()

    expect(config.REDIS_HOST).toBe('localhost')
  })

  it('should parse REDIS_PORT when provided', () => {
    process.env.REDIS_PORT = '6379'

    const config = throttleConfig()

    expect(config.REDIS_PORT).toBe(6379)
  })

  it('should parse REDIS_PORT as number', () => {
    process.env.REDIS_PORT = '9999'

    const config = throttleConfig()

    expect(config.REDIS_PORT).toBe(9999)
    expect(typeof config.REDIS_PORT).toBe('number')
  })

  it('should enable Redis when NODE_ENV is production and REDIS_HOST is provided', () => {
    process.env.NODE_ENV = 'production'
    process.env.REDIS_HOST = 'redis.example.com'

    const config = throttleConfig()

    expect(config.redisEnabled).toBe(true)
  })

  it('should disable Redis when NODE_ENV is not production even with REDIS_HOST', () => {
    process.env.NODE_ENV = 'development'
    process.env.REDIS_HOST = 'localhost'

    const config = throttleConfig()

    expect(config.redisEnabled).toBe(false)
  })

  it('should disable Redis when NODE_ENV is production but REDIS_HOST is missing', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.REDIS_HOST

    const config = throttleConfig()

    expect(config.redisEnabled).toBe(false)
  })

  it('should disable Redis when NODE_ENV is production and REDIS_HOST is empty', () => {
    process.env.NODE_ENV = 'production'
    process.env.REDIS_HOST = ''

    const config = throttleConfig()

    expect(config.redisEnabled).toBe(false)
  })

  it('should have KEY property from registerAs', () => {
    expect(throttleConfig).toHaveProperty('KEY')
    expect(throttleConfig.KEY).toBe('CONFIGURATION(throttle)')
  })

  it('should parse all custom values together', () => {
    process.env.THROTTLE_TTL = '45000'
    process.env.THROTTLE_LIMIT = '150'
    process.env.REDIS_HOST = 'redis-server'
    process.env.REDIS_PORT = '6380'
    process.env.NODE_ENV = 'production'

    const config = throttleConfig()

    expect(config).toEqual({
      TTL: 45000,
      LIMIT: 150,
      REDIS_HOST: 'redis-server',
      REDIS_PORT: 6380,
      redisEnabled: true,
    })
  })

  it('should handle test environment', () => {
    process.env.NODE_ENV = 'test'
    process.env.REDIS_HOST = 'localhost'

    const config = throttleConfig()

    expect(config.redisEnabled).toBe(false)
  })

  it('should coerce string numbers correctly', () => {
    process.env.THROTTLE_TTL = '90000'
    process.env.THROTTLE_LIMIT = '250'
    process.env.REDIS_PORT = '6379'

    const config = throttleConfig()

    expect(typeof config.TTL).toBe('number')
    expect(typeof config.LIMIT).toBe('number')
    expect(typeof config.REDIS_PORT).toBe('number')
  })
})
