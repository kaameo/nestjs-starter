import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { MetricsService } from './metrics.service'
import { MetricsConfig } from '../../common/config/metrics.config'

describe('MetricsService', () => {
  const defaultConfig: MetricsConfig = { ENABLED: true, PREFIX: 'test_' }

  const createService = async (config: MetricsConfig = defaultConfig) => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn().mockReturnValue(config),
          },
        },
      ],
    }).compile()

    return module.get<MetricsService>(MetricsService)
  }

  it('should create a registry', async () => {
    const service = await createService()
    expect(service.getRegistry()).toBeDefined()
  })

  it('should register http request duration histogram', async () => {
    const service = await createService()
    const registry = service.getRegistry()
    const metric = await registry.getSingleMetric('test_http_request_duration_seconds')
    expect(metric).toBeDefined()
  })

  it('should collect default metrics when enabled', async () => {
    const service = await createService({ ENABLED: true, PREFIX: 'test_' })
    service.onModuleInit()
    const metrics = await service.getMetrics()
    expect(metrics).toContain('test_process_cpu')
  })

  it('should not collect default metrics when disabled', async () => {
    const service = await createService({ ENABLED: false, PREFIX: 'test_' })
    service.onModuleInit()
    const metrics = await service.getMetrics()
    expect(metrics).not.toContain('test_process_cpu')
  })

  it('should return metrics as string', async () => {
    const service = await createService()
    const metrics = await service.getMetrics()
    expect(typeof metrics).toBe('string')
  })

  it('should return content type', async () => {
    const service = await createService()
    expect(service.getContentType()).toContain('text/plain')
  })

  it('should return http request duration histogram', async () => {
    const service = await createService()
    expect(service.getHttpRequestDuration()).toBeDefined()
  })
})
