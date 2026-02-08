import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { UserModel } from '../../domain/models/user.model'
import { UserRepositoryPort } from '../../domain/ports/out/user-repository.port'
import { UpdateUserCommand } from './update-user.command'
import { UpdateUserHandler } from './update-user.handler'

describe('UpdateUserHandler', () => {
  let handler: UpdateUserHandler
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

    handler = new UpdateUserHandler(userRepository)
  })

  it('should update user when user exists', async () => {
    const command = new UpdateUserCommand('123e4567-e89b-12d3-a456-426614174000', {
      name: 'Updated Name',
    })

    const updatedUser = UserModel.create({
      ...mockUser,
      name: 'Updated Name',
    })

    vi.mocked(userRepository.findById).mockResolvedValue(mockUser)
    vi.mocked(userRepository.update).mockResolvedValue(updatedUser)

    const result = await handler.execute(command)

    expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
    expect(userRepository.update).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000', {
      name: 'Updated Name',
    })
    expect(result).toBe(updatedUser)
  })

  it('should throw NotFoundException when user does not exist', async () => {
    const command = new UpdateUserCommand('non-existent-id', {
      name: 'Updated Name',
    })

    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException)
    await expect(handler.execute(command)).rejects.toThrow('User not found')

    expect(userRepository.findById).toHaveBeenCalledWith('non-existent-id')
    expect(userRepository.update).not.toHaveBeenCalled()
  })
})
