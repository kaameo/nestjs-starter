import { registerAs } from '@nestjs/config'
import { z } from 'zod'

const schema = z.object({
  HOST: z.string().default('localhost'),
  PORT: z.coerce.number().default(5432),
  USER: z.string().default('postgres'),
  PASSWORD: z.string().default('postgres'),
  NAME: z.string().default('nestjs_starter'),
})

export type DatabaseConfig = z.infer<typeof schema>

export default registerAs('database', (): DatabaseConfig => {
  return schema.parse({
    HOST: process.env.DATABASE_HOST,
    PORT: process.env.DATABASE_PORT,
    USER: process.env.DATABASE_USER,
    PASSWORD: process.env.DATABASE_PASSWORD,
    NAME: process.env.DATABASE_NAME,
  })
})
