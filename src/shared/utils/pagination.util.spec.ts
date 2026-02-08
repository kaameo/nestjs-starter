import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'

import { paginate, PaginationQueryDto } from '@/shared/utils/pagination.util'

describe('paginate', () => {
  it('should calculate totalPages correctly', () => {
    const result = paginate(100, 1, 20)

    expect(result).toEqual({
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5,
    })
  })

  it('should handle zero total', () => {
    const result = paginate(0, 1, 20)

    expect(result).toEqual({
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    })
  })

  it('should handle partial last page', () => {
    const result = paginate(21, 1, 20)

    expect(result).toEqual({
      total: 21,
      page: 1,
      limit: 20,
      totalPages: 2,
    })
  })

  it('should handle exact division', () => {
    const result = paginate(40, 2, 20)

    expect(result).toEqual({
      total: 40,
      page: 2,
      limit: 20,
      totalPages: 2,
    })
  })

  it('should calculate totalPages when not divisible by limit', () => {
    const result = paginate(95, 1, 10)

    expect(result).toEqual({
      total: 95,
      page: 1,
      limit: 10,
      totalPages: 10,
    })
  })

  it('should handle large datasets', () => {
    const result = paginate(10000, 50, 100)

    expect(result).toEqual({
      total: 10000,
      page: 50,
      limit: 100,
      totalPages: 100,
    })
  })

  it('should handle single item per page', () => {
    const result = paginate(50, 1, 1)

    expect(result).toEqual({
      total: 50,
      page: 1,
      limit: 1,
      totalPages: 50,
    })
  })

  it('should handle when limit is greater than total', () => {
    const result = paginate(5, 1, 100)

    expect(result).toEqual({
      total: 5,
      page: 1,
      limit: 100,
      totalPages: 1,
    })
  })

  it('should maintain correct totalPages for middle pages', () => {
    const result = paginate(250, 3, 25)

    expect(result).toEqual({
      total: 250,
      page: 3,
      limit: 25,
      totalPages: 10,
    })
  })
})

describe('PaginationQueryDto', () => {
  it('should use default values when not provided', () => {
    const dto = new PaginationQueryDto()

    expect(dto.page).toBe(1)
    expect(dto.limit).toBe(20)
  })

  it('should accept valid page and limit values', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 5,
      limit: 50,
    })

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.page).toBe(5)
    expect(dto.limit).toBe(50)
  })

  it('should transform string values to numbers', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: '10',
      limit: '30',
    })

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.page).toBe(10)
    expect(dto.limit).toBe(30)
  })

  it('should fail validation when page is less than 1', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 0,
      limit: 20,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('page')
  })

  it('should fail validation when page is negative', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: -1,
      limit: 20,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('page')
  })

  it('should fail validation when limit is less than 1', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 1,
      limit: 0,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('limit')
  })

  it('should fail validation when limit exceeds 100', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 1,
      limit: 101,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('limit')
  })

  it('should accept maximum valid limit of 100', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 1,
      limit: 100,
    })

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.limit).toBe(100)
  })

  it('should fail validation when page is not an integer', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 1.5,
      limit: 20,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('page')
  })

  it('should fail validation when limit is not an integer', async () => {
    const dto = plainToInstance(PaginationQueryDto, {
      page: 1,
      limit: 20.7,
    })

    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('limit')
  })

  it('should allow omitting both parameters (use defaults)', async () => {
    const dto = plainToInstance(PaginationQueryDto, {})

    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
    expect(dto.page).toBe(1)
    expect(dto.limit).toBe(20)
  })
})
