export interface UserProps {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: string
  readonly emailVerified: boolean
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class UserModel {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: string
  readonly emailVerified: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: UserProps) {
    this.id = props.id
    this.email = props.email
    this.name = props.name
    this.role = props.role
    this.emailVerified = props.emailVerified
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(props: UserProps): UserModel {
    return new UserModel(props)
  }

  isAdmin(): boolean {
    return this.role === 'admin'
  }

  isEmailVerified(): boolean {
    return this.emailVerified
  }
}
