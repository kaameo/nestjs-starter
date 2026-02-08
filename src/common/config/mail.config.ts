import { registerAs } from '@nestjs/config'
import { z } from 'zod'

const schema = z.object({
  HOST: z.string().default('localhost'),
  PORT: z.coerce.number().default(1025),
  USER: z.string().optional().default(''),
  PASSWORD: z.string().optional().default(''),
  FROM: z.string().default('noreply@nestjs-starter.local'),
  VERIFICATION_URL: z.string().default('http://localhost:3000/api/v1/auth/verify-email'),
})

export type MailConfig = z.infer<typeof schema>

export default registerAs('mail', (): MailConfig => {
  return schema.parse({
    HOST: process.env.MAIL_HOST,
    PORT: process.env.MAIL_PORT,
    USER: process.env.MAIL_USER,
    PASSWORD: process.env.MAIL_PASSWORD,
    FROM: process.env.MAIL_FROM,
    VERIFICATION_URL: process.env.MAIL_VERIFICATION_URL,
  })
})
