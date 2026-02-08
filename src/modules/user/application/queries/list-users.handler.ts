import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'

import { PaginationMeta, paginate } from '@/shared/utils/pagination.util'

import { UserModel } from '../../domain/models/user.model'
import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../domain/ports/out/user-repository.port'
import { ListUsersQuery } from './list-users.query'

@QueryHandler(ListUsersQuery)
export class ListUsersHandler
  implements IQueryHandler<ListUsersQuery, { data: UserModel[]; meta: PaginationMeta }>
{
  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(
    query: ListUsersQuery,
  ): Promise<{ data: UserModel[]; meta: PaginationMeta }> {
    const { data, total } = await this.userRepository.findAll({
      page: query.page,
      limit: query.limit,
    })

    return {
      data,
      meta: paginate(total, query.page, query.limit),
    }
  }
}
