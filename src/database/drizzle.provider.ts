import { ConfigService } from '@nestjs/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import type { DatabaseConfig } from '@/common/config/database.config'

import * as schema from './schema'

export const DRIZZLE = Symbol('DRIZZLE')

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>

export const drizzleProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const dbConfig = configService.get<DatabaseConfig>('database')!

    const connectionString = `postgresql://${dbConfig.USER}:${dbConfig.PASSWORD}@${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.NAME}`

    const client = postgres(connectionString)

    return drizzle(client, { schema })
  },
}
