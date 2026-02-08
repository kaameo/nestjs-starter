import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import helmet from '@fastify/helmet'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { globalValidationPipe } from './common/pipes/validation.pipe'
import { AppConfig } from './common/config/app.config'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  })

  const logger = app.get(Logger)
  app.useLogger(logger)

  const configService = app.get(ConfigService)
  const appConfig = configService.get<AppConfig>('app')!

  // Fastify plugins
  await app.register(helmet)
  await app.register(fastifyCookie)
  await app.register(fastifyCors, {
    origin: appConfig.NODE_ENV === 'production' ? false : true,
    credentials: true,
  })

  // Global prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/health/ready', '/metrics'],
  })

  // Global pipes, filters, interceptors
  app.useGlobalPipes(globalValidationPipe)
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())

  // Shutdown hooks
  app.enableShutdownHooks()

  // Swagger (non-production only)
  if (appConfig.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NestJS Starter API')
      .setDescription('Production-ready NestJS starter template API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/v1/docs', app, document)
  }

  await app.listen(appConfig.PORT, appConfig.HOST)
  logger.log(`Application is running on: ${appConfig.HOST}:${appConfig.PORT}`)
}

bootstrap()
