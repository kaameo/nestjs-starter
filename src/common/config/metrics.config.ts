import { registerAs } from '@nestjs/config'
import { z } from 'zod'

const schema = z.object({
  ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  PREFIX: z.string().default('nestjs_'),
})

export type MetricsConfig = z.infer<typeof schema>

export default registerAs('metrics', (): MetricsConfig => {
  return schema.parse({
    ENABLED: process.env.METRICS_ENABLED,
    PREFIX: process.env.METRICS_PREFIX,
  })
})
