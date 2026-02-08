import { ApiProperty } from '@nestjs/swagger'
import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  readonly id!: string

  @Expose()
  @ApiProperty()
  readonly email!: string

  @Expose()
  @ApiProperty()
  readonly name!: string

  @Expose()
  @ApiProperty()
  readonly role!: string

  @Expose()
  @ApiProperty()
  readonly emailVerified!: boolean

  @Expose()
  @ApiProperty()
  readonly createdAt!: Date

  @Expose()
  @ApiProperty()
  readonly updatedAt!: Date
}
