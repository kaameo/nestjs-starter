import { describe, it, expect, beforeEach } from 'vitest'

import { ThrottlerBehindProxyGuard } from './throttler-behind-proxy.guard'

describe('ThrottlerBehindProxyGuard', () => {
  let guard: ThrottlerBehindProxyGuard

  beforeEach(() => {
    guard = new ThrottlerBehindProxyGuard(
      {
        throttlers: [],
      },
      {} as any,
      {} as any,
    )
  })

  describe('getTracker', () => {
    it('should return raw.ip when available', async () => {
      const req = {
        raw: {
          ip: '192.168.1.100',
        },
      }

      const result = await (guard as any).getTracker(req)

      expect(result).toBe('192.168.1.100')
    })

    it('should fallback to ip when raw.ip is not available', async () => {
      const req = {
        ip: '10.0.0.50',
      }

      const result = await (guard as any).getTracker(req)

      expect(result).toBe('10.0.0.50')
    })

    it('should fallback to "unknown" when neither raw.ip nor ip is available', async () => {
      const req = {}

      const result = await (guard as any).getTracker(req)

      expect(result).toBe('unknown')
    })

    it('should prefer raw.ip over ip when both are available', async () => {
      const req = {
        raw: {
          ip: '192.168.1.100',
        },
        ip: '10.0.0.50',
      }

      const result = await (guard as any).getTracker(req)

      expect(result).toBe('192.168.1.100')
    })

    it('should return "unknown" when raw exists but raw.ip is undefined', async () => {
      const req = {
        raw: {},
        ip: '10.0.0.50',
      }

      const result = await (guard as any).getTracker(req)

      expect(result).toBe('10.0.0.50')
    })

    it('should handle null values gracefully', async () => {
      const req = {
        raw: null,
        ip: null,
      }

      const result = await (guard as any).getTracker(req)

      expect(result).toBe('unknown')
    })
  })
})
