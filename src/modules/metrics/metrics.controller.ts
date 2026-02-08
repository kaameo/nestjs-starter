import { Controller, Get, Header } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { Public } from '../../common/decorators/public.decorator'
import { MetricsService } from './metrics.service'

@Controller('metrics')
@Public()
@SkipThrottle()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics()
  }
}
