import { Module, forwardRef } from '@nestjs/common'
import { CqrsModule } from '@nestjs/cqrs'

import { DeleteUserHandler } from './application/commands/delete-user.handler'
import { UpdateUserHandler } from './application/commands/update-user.handler'
import { GetUserHandler } from './application/queries/get-user.handler'
import { ListUsersHandler } from './application/queries/list-users.handler'
import { USER_REPOSITORY_PORT } from './domain/ports/out/user-repository.port'
import { UserService } from './domain/services/user.service'
import { DrizzleUserRepositoryAdapter } from './infrastructure/adapters/drizzle-user-repository.adapter'
import { UserController } from './infrastructure/controllers/user.controller'

const QueryHandlers = [GetUserHandler, ListUsersHandler]
const CommandHandlers = [UpdateUserHandler, DeleteUserHandler]

@Module({
  imports: [CqrsModule],
  controllers: [UserController],
  providers: [
    {
      provide: USER_REPOSITORY_PORT,
      useClass: DrizzleUserRepositoryAdapter,
    },
    UserService,
    ...QueryHandlers,
    ...CommandHandlers,
  ],
  exports: [USER_REPOSITORY_PORT, UserService],
})
export class UserModule {}
