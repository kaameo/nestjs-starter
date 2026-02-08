import { describe, it, expect } from 'vitest'

import { UserModel } from './user.model'

describe('UserModel', () => {
  const baseUserProps = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('create', () => {
    it('should create a user model with all properties', () => {
      const user = UserModel.create(baseUserProps)

      expect(user.id).toBe(baseUserProps.id)
      expect(user.email).toBe(baseUserProps.email)
      expect(user.name).toBe(baseUserProps.name)
      expect(user.role).toBe(baseUserProps.role)
      expect(user.emailVerified).toBe(baseUserProps.emailVerified)
      expect(user.createdAt).toBe(baseUserProps.createdAt)
      expect(user.updatedAt).toBe(baseUserProps.updatedAt)
    })
  })

  describe('isAdmin', () => {
    it('should return true when role is admin', () => {
      const adminUser = UserModel.create({
        ...baseUserProps,
        role: 'admin',
      })

      expect(adminUser.isAdmin()).toBe(true)
    })

    it('should return false when role is not admin', () => {
      const regularUser = UserModel.create({
        ...baseUserProps,
        role: 'user',
      })

      expect(regularUser.isAdmin()).toBe(false)
    })

    it('should return false for other roles', () => {
      const moderatorUser = UserModel.create({
        ...baseUserProps,
        role: 'moderator',
      })

      expect(moderatorUser.isAdmin()).toBe(false)
    })
  })

  describe('isEmailVerified', () => {
    it('should return true when email is verified', () => {
      const verifiedUser = UserModel.create({
        ...baseUserProps,
        emailVerified: true,
      })

      expect(verifiedUser.isEmailVerified()).toBe(true)
    })

    it('should return false when email is not verified', () => {
      const unverifiedUser = UserModel.create({
        ...baseUserProps,
        emailVerified: false,
      })

      expect(unverifiedUser.isEmailVerified()).toBe(false)
    })
  })
})
