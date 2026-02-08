import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'

import { UserService } from '@/modules/user/domain/services/user.service'
import { UserRepositoryPort } from '@/modules/user/domain/ports/out/user-repository.port'
import { UserModel } from '@/modules/user/domain/models/user.model'

describe('UserService', () => {
  let userService: UserService
  let userRepository: UserRepositoryPort

  const mockUser = UserModel.create({
    id: 'user-id-1',
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
      findByEmailWithPassword: vi.fn(),
      findByVerificationToken: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
    }

    userService = new UserService(userRepository as any)
  })

  describe('getUser', () => {
    it('should return user when found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser)

      const result = await userService.getUser('user-id-1')

      expect(result).toEqual(mockUser)
    })

    it('should throw NotFoundException when not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      await expect(userService.getUser('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateUser', () => {
    it('should update and return user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser)
      vi.mocked(userRepository.update).mockResolvedValue(
        UserModel.create({ ...mockUser, name: 'Updated Name' }),
      )

      const result = await userService.updateUser('user-id-1', {
        name: 'Updated Name',
      })

      expect(result.name).toBe('Updated Name')
    })

    it('should throw NotFoundException when user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      await expect(userService.updateUser('nonexistent', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('deleteUser', () => {
    it('should delete user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser)
      vi.mocked(userRepository.delete).mockResolvedValue(undefined)

      await expect(userService.deleteUser('user-id-1')).resolves.toBeUndefined()
    })

    it('should throw NotFoundException when user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null)

      await expect(userService.deleteUser('nonexistent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('listUsers', () => {
    it('should return paginated list', async () => {
      vi.mocked(userRepository.findAll).mockResolvedValue({
        data: [mockUser],
        total: 1,
      })

      const result = await userService.listUsers({ page: 1, limit: 20 })

      expect(result.data).toHaveLength(1)
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    })
  })
})
