import { Injectable, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Registry, collectDefaultMetrics, Histogram } from 'prom-client'
import { MetricsConfig } from '../../common/config/metrics.config'

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: Registry
  private readonly httpRequestDuration: Histogram

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<MetricsConfig>('metrics')!

    this.registry = new Registry()
    this.registry.setDefaultLabels({ app: 'nestjs-starter' })

    this.httpRequestDuration = new Histogram({
      name: `${config.PREFIX}http_request_duration_seconds`,
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    })
  }

  onModuleInit() {
    const config = this.configService.get<MetricsConfig>('metrics')!

    if (config.ENABLED) {
      collectDefaultMetrics({
        register: this.registry,
        prefix: config.PREFIX,
      })
    }
  }

  getRegistry(): Registry {
    return this.registry
  }

  getHttpRequestDuration(): Histogram {
    return this.httpRequestDuration
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics()
  }

  getContentType(): string {
    return this.registry.contentType
  }
}
