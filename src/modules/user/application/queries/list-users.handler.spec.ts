import { describe, it, expect, vi, beforeEach } from 'vitest'

import { UserModel } from '../../domain/models/user.model'
import { UserRepositoryPort } from '../../domain/ports/out/user-repository.port'
import { ListUsersQuery } from './list-users.query'
import { ListUsersHandler } from './list-users.handler'

describe('ListUsersHandler', () => {
  let handler: ListUsersHandler
  let userRepository: UserRepositoryPort

  const mockUsers = [
    UserModel.create({
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'user1@example.com',
      name: 'User One',
      role: 'user',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    UserModel.create({
      id: '223e4567-e89b-12d3-a456-426614174001',
      email: 'user2@example.com',
      name: 'User Two',
      role: 'admin',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ]

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }

    handler = new ListUsersHandler(userRepository)
  })

  it('should return paginated users', async () => {
    const query = new ListUsersQuery(1, 10)

    vi.mocked(userRepository.findAll).mockResolvedValue({
      data: mockUsers,
      total: 2,
    })

    const result = await handler.execute(query)

    expect(userRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    })
    expect(result.data).toEqual(mockUsers)
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    })
  })

  it('should handle pagination correctly for page 2', async () => {
    const query = new ListUsersQuery(2, 10)

    vi.mocked(userRepository.findAll).mockResolvedValue({
      data: [],
      total: 15,
    })

    const result = await handler.execute(query)

    expect(userRepository.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
    })
    expect(result.data).toEqual([])
    expect(result.meta).toEqual({
      total: 15,
      page: 2,
      limit: 10,
      totalPages: 2,
    })
  })

  it('should handle empty results', async () => {
    const query = new ListUsersQuery(1, 10)

    vi.mocked(userRepository.findAll).mockResolvedValue({
      data: [],
      total: 0,
    })

    const result = await handler.execute(query)

    expect(result.data).toEqual([])
    expect(result.meta.total).toBe(0)
    expect(result.meta.totalPages).toBe(1)
  })
})
