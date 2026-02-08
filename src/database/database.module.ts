import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common'

import { DRIZZLE, drizzleProvider, DrizzleDatabase } from './drizzle.provider'

@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDatabase,
  ) {}

  async onModuleDestroy() {
    // postgres.js connections are cleaned up automatically
    // but we can explicitly end if needed
  }
}
