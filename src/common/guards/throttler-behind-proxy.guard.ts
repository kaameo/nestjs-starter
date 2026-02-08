import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { ExecutionContext } from '@nestjs/common'

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const rawReq = req as { raw?: { ip?: string }; ip?: string }
    return Promise.resolve(rawReq.raw?.ip ?? rawReq.ip ?? 'unknown')
  }
}
