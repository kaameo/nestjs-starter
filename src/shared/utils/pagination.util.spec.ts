import { describe, it, expect } from 'vitest'

import { paginate } from '@/shared/utils/pagination.util'

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
})
