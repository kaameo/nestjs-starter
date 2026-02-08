import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'

import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { Roles } from '@/common/decorators/roles.decorator'
import { PaginationQueryDto } from '@/shared/utils/pagination.util'

import { DeleteUserCommand } from '../../application/commands/delete-user.command'
import { UpdateUserCommand } from '../../application/commands/update-user.command'
import { UpdateUserDto } from '../../application/dto/update-user.dto'
import { GetUserQuery } from '../../application/queries/get-user.query'
import { ListUsersQuery } from '../../application/queries/list-users.query'

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMe(@CurrentUser() user: { sub: string }) {
    return this.queryBus.execute(new GetUserQuery(user.sub))
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.commandBus.execute(
      new UpdateUserCommand(user.sub, { name: dto.name }),
    )
  }

  @Get('me/posts')
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({ summary: 'List my posts (not implemented)' })
  @ApiResponse({ status: 501, description: 'Not Implemented' })
  async getMyPosts() {
    return {
      statusCode: 501,
      message:
        'User posts endpoint is planned for a future release. See POST module reference in PRD.',
    }
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listUsers(@Query() query: PaginationQueryDto) {
    return this.queryBus.execute(new ListUsersQuery(query.page, query.limit))
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user by ID (admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryBus.execute(new GetUserQuery(id))
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.commandBus.execute(new DeleteUserCommand(id))
  }
}
