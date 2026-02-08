import { registerAs } from '@nestjs/config'
import { z } from 'zod'

const schema = z.object({
  SECRET: z.string().min(1),
  EXPIRATION: z.string().default('15m'),
  REFRESH_SECRET: z.string().min(1),
  REFRESH_EXPIRATION: z.string().default('7d'),
})

export type JwtConfig = z.infer<typeof schema>

export default registerAs('jwt', (): JwtConfig => {
  return schema.parse({
    SECRET: process.env.JWT_SECRET,
    EXPIRATION: process.env.JWT_EXPIRATION,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION,
  })
})
