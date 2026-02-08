import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { DeleteUserCommand } from '../../application/commands/delete-user.command'
import { UpdateUserCommand } from '../../application/commands/update-user.command'
import { GetUserQuery } from '../../application/queries/get-user.query'
import { ListUsersQuery } from '../../application/queries/list-users.query'
import { UserModel } from '../../domain/models/user.model'
import { UserController } from './user.controller'

describe('UserController', () => {
  let controller: UserController
  let commandBus: CommandBus
  let queryBus: QueryBus

  const mockUser = UserModel.create({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  beforeEach(() => {
    commandBus = {
      execute: vi.fn(),
    } as any

    queryBus = {
      execute: vi.fn(),
    } as any

    controller = new UserController(commandBus, queryBus)
  })

  describe('getMe', () => {
    it('should get current user profile', async () => {
      const currentUser = { sub: '123e4567-e89b-12d3-a456-426614174000' }
      vi.mocked(queryBus.execute).mockResolvedValue(mockUser)

      const result = await controller.getMe(currentUser)

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetUserQuery('123e4567-e89b-12d3-a456-426614174000'),
      )
      expect(result).toBe(mockUser)
    })
  })

  describe('updateMe', () => {
    it('should update current user profile', async () => {
      const currentUser = { sub: '123e4567-e89b-12d3-a456-426614174000' }
      const dto = { name: 'Updated Name' }
      const updatedUser = UserModel.create({ ...mockUser, name: 'Updated Name' })

      vi.mocked(commandBus.execute).mockResolvedValue(updatedUser)

      const result = await controller.updateMe(currentUser, dto)

      expect(commandBus.execute).toHaveBeenCalledWith(
        new UpdateUserCommand('123e4567-e89b-12d3-a456-426614174000', { name: 'Updated Name' }),
      )
      expect(result).toBe(updatedUser)
    })
  })

  describe('getMyPosts', () => {
    it('should return not implemented response', async () => {
      const result = await controller.getMyPosts()

      expect(result).toEqual({
        statusCode: 501,
        message:
          'User posts endpoint is planned for a future release. See POST module reference in PRD.',
      })
    })
  })

  describe('listUsers', () => {
    it('should list users with pagination', async () => {
      const query = { page: 1, limit: 10 }
      const mockResponse = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      }

      vi.mocked(queryBus.execute).mockResolvedValue(mockResponse)

      const result = await controller.listUsers(query)

      expect(queryBus.execute).toHaveBeenCalledWith(new ListUsersQuery(1, 10))
      expect(result).toBe(mockResponse)
    })
  })

  describe('getUser', () => {
    it('should get user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      vi.mocked(queryBus.execute).mockResolvedValue(mockUser)

      const result = await controller.getUser(userId)

      expect(queryBus.execute).toHaveBeenCalledWith(new GetUserQuery(userId))
      expect(result).toBe(mockUser)
    })
  })

  describe('deleteUser', () => {
    it('should delete user by id', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000'
      vi.mocked(commandBus.execute).mockResolvedValue(undefined)

      await controller.deleteUser(userId)

      expect(commandBus.execute).toHaveBeenCalledWith(new DeleteUserCommand(userId))
    })
  })
})
