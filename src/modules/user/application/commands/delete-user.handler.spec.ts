import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { UserModel } from '../../domain/models/user.model'
import { UserRepositoryPort } from '../../domain/ports/out/user-repository.port'
import { DeleteUserCommand } from './delete-user.command'
import { DeleteUserHandler } from './delete-user.handler'

describe('DeleteUserHandler', () => {
  let handler: DeleteUserHandler
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

    handler = new DeleteUserHandler(userRepository)
  })

  it('should delete user when user exists', async () => {
    const command = new DeleteUserCommand('123e4567-e89b-12d3-a456-426614174000')

    vi.mocked(userRepository.findById).mockResolvedValue(mockUser)
    vi.mocked(userRepository.delete).mockResolvedValue(undefined)

    await handler.execute(command)

    expect(userRepository.findById).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
    expect(userRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
  })

  it('should throw NotFoundException when user does not exist', async () => {
    const command = new DeleteUserCommand('non-existent-id')

    vi.mocked(userRepository.findById).mockResolvedValue(null)

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException)
    await expect(handler.execute(command)).rejects.toThrow('User not found')

    expect(userRepository.findById).toHaveBeenCalledWith('non-existent-id')
    expect(userRepository.delete).not.toHaveBeenCalled()
  })
})
