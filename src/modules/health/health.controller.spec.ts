import { ServiceUnavailableException } from '@nestjs/common'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'

import { HealthController } from './health.controller'

describe('HealthController', () => {
  let controller: HealthController
  let db: any

  beforeEach(() => {
    db = {
      execute: vi.fn(),
    }

    controller = new HealthController(db)
  })

  describe('liveness', () => {
    it('should return status ok', () => {
      const result = controller.liveness()

      expect(result).toEqual({ status: 'ok' })
    })
  })

  describe('readiness', () => {
    it('should return status ok when database is connected', async () => {
      vi.mocked(db.execute).mockResolvedValue(undefined)

      const result = await controller.readiness()

      expect(db.execute).toHaveBeenCalledWith(sql`SELECT 1`)
      expect(result).toEqual({ status: 'ok', database: 'connected' })
    })

    it('should throw ServiceUnavailableException when database is disconnected', async () => {
      vi.mocked(db.execute).mockRejectedValue(new Error('Database connection failed'))

      await expect(controller.readiness()).rejects.toThrow(ServiceUnavailableException)

      try {
        await controller.readiness()
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException)
        expect((error as ServiceUnavailableException).getResponse()).toEqual({
          status: 'error',
          database: 'disconnected',
        })
      }

      expect(db.execute).toHaveBeenCalledWith(sql`SELECT 1`)
    })
  })
})
