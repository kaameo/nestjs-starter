import { describe, it, expect } from 'vitest'
import { Reflector } from '@nestjs/core'

import { ROLES_KEY, Roles } from './roles.decorator'

describe('Roles Decorator', () => {
  it('should export ROLES_KEY as "roles"', () => {
    expect(ROLES_KEY).toBe('roles')
  })

  it('should set metadata with single role', () => {
    const reflector = new Reflector()

    class TestController {
      @Roles('admin')
      testMethod() {}
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod)

    expect(roles).toEqual(['admin'])
  })

  it('should set metadata with multiple roles', () => {
    const reflector = new Reflector()

    class TestController {
      @Roles('admin', 'moderator', 'user')
      testMethod() {}
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod)

    expect(roles).toEqual(['admin', 'moderator', 'user'])
  })

  it('should set metadata with no roles', () => {
    const reflector = new Reflector()

    class TestController {
      @Roles()
      testMethod() {}
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod)

    expect(roles).toEqual([])
  })

  it('should work on class level', () => {
    const reflector = new Reflector()

    @Roles('admin', 'superuser')
    class TestController {
      testMethod() {}
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController)

    expect(roles).toEqual(['admin', 'superuser'])
  })

  it('should preserve role order', () => {
    const reflector = new Reflector()

    class TestController {
      @Roles('user', 'admin', 'moderator')
      testMethod() {}
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod)

    expect(roles).toEqual(['user', 'admin', 'moderator'])
  })

  it('should allow duplicate roles', () => {
    const reflector = new Reflector()

    class TestController {
      @Roles('admin', 'admin', 'user')
      testMethod() {}
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod)

    expect(roles).toEqual(['admin', 'admin', 'user'])
  })

  it('should work with special characters in role names', () => {
    const reflector = new Reflector()

    class TestController {
      @Roles('admin:read', 'user:write', 'super-admin')
      testMethod() {}
    }

    const roles = reflector.get<string[]>(ROLES_KEY, TestController.prototype.testMethod)

    expect(roles).toEqual(['admin:read', 'user:write', 'super-admin'])
  })

  it('should return a function decorator', () => {
    const decorator = Roles('admin')

    expect(typeof decorator).toBe('function')
  })
})
