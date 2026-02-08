import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

import { Public } from '@/common/decorators/public.decorator'
import { DRIZZLE, DrizzleDatabase } from '@/database/drizzle.provider'
import { sql } from 'drizzle-orm'

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDatabase,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return { status: 'ok' }
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness check (includes DB)' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async readiness() {
    try {
      await this.db.execute(sql`SELECT 1`)
      return { status: 'ok', database: 'connected' }
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
      })
    }
  }
}
