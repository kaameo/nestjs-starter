import { registerAs } from '@nestjs/config'
import { z } from 'zod'

const schema = z.object({
  TTL: z.coerce.number().default(60000),
  LIMIT: z.coerce.number().default(100),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
})

export type ThrottleConfig = z.infer<typeof schema> & { redisEnabled: boolean }

export default registerAs('throttle', (): ThrottleConfig => {
  const parsed = schema.parse({
    TTL: process.env.THROTTLE_TTL,
    LIMIT: process.env.THROTTLE_LIMIT,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
  })

  return {
    ...parsed,
    redisEnabled: process.env.NODE_ENV === 'production' && !!parsed.REDIS_HOST,
  }
})
