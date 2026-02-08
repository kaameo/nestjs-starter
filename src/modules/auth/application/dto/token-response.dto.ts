import { ApiProperty } from '@nestjs/swagger'
import { Expose } from 'class-transformer'

export class TokenResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
  @Expose()
  readonly accessToken!: string

  @ApiProperty({ example: 'Bearer' })
  @Expose()
  readonly tokenType: string = 'Bearer'

  @ApiProperty({ example: 900 })
  @Expose()
  readonly expiresIn!: number
}
