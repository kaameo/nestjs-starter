import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { CqrsModule } from '@nestjs/cqrs'
import { LoggerModule } from 'nestjs-pino'
import {
  appConfig,
  databaseConfig,
  jwtConfig,
  mailConfig,
  metricsConfig,
  throttleConfig,
  type AppConfig,
  type ThrottleConfig,
} from './common/config'
import { ThrottlerBehindProxyGuard } from './common/guards/throttler-behind-proxy.guard'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { RolesGuard } from './common/guards/roles.guard'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth/auth.module'
import { UserModule } from './modules/user/user.module'
import { HealthModule } from './modules/health/health.module'
import { MetricsModule } from './modules/metrics/metrics.module'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, mailConfig, throttleConfig, metricsConfig],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),

    // Logging
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const app = config.get<AppConfig>('app')!
        return {
          pinoHttp: {
            level: app.LOG_LEVEL,
            transport:
              app.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
            autoLogging: true,
            redact: {
              paths: [
                'req.headers.authorization',
                'req.body.password',
                'req.body.token',
                'req.body.refreshToken',
              ],
              censor: '***',
            },
          },
        }
      },
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const throttle = config.get<ThrottleConfig>('throttle')!

        const baseConfig = {
          throttlers: [
            {
              name: 'default',
              ttl: throttle.TTL,
              limit: throttle.LIMIT,
            },
          ],
        }

        if (throttle.redisEnabled && throttle.REDIS_HOST) {
          // Dynamic import for Redis storage in production
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { ThrottlerStorageRedisService } = require('@nestjs/throttler-storage-redis')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const Redis = require('ioredis')
          return {
            ...baseConfig,
            storage: new ThrottlerStorageRedisService(
              new Redis({
                host: throttle.REDIS_HOST,
                port: throttle.REDIS_PORT,
              }),
            ),
          }
        }

        return baseConfig
      },
    }),

    // Database
    DatabaseModule,

    // CQRS
    CqrsModule.forRoot(),

    // Modules
    AuthModule,
    UserModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
