import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { UserModel } from '../../domain/models/user.model'
import { UserRepositoryPort } from '../../domain/ports/out/user-repository.port'
import { GetUserQuery } from './get-user.query'
import { GetUserHandler } from './get-user.handler'

describe('GetUserHandler', () => {
  let handler: GetUserHandler
  let userRepository: UserRepositoryPort

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
    userRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }

    handler = new GetUserHandler(userRepository)
  })

  it('should return user when user exists', async () => {
    const query = new GetUserQuery('123e4567-e89b-12d3-a456-426614174000')

    vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

    const result = await handler.execute(query)

    expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
    expect(result).toBe(mockUser)
  })

  it('should throw NotFoundException when user does not exist', async () => {
    const query = new GetUserQuery('non-existent-id')

    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(handler.execute(query)).rejects.toThrow(NotFoundException)
    await expect(handler.execute(query)).rejects.toThrow('User not found')

    expect(userRepository.findById).toHaveBeenCalledWith('non-existent-id')
  })
})
