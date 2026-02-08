import { Test, TestingModule } from '@nestjs/testing'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'

describe('MetricsController', () => {
  let controller: MetricsController
  let metricsService: MetricsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: {
            getMetrics: vi.fn().mockResolvedValue('# HELP test_metric\ntest_metric 1'),
            getContentType: vi.fn().mockReturnValue('text/plain; version=0.0.4'),
          },
        },
      ],
    }).compile()

    controller = module.get<MetricsController>(MetricsController)
    metricsService = module.get<MetricsService>(MetricsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should return metrics string', async () => {
    const result = await controller.getMetrics()
    expect(result).toContain('test_metric')
    expect(metricsService.getMetrics).toHaveBeenCalled()
  })
})
