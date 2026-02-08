import { UserModel } from '../../models/user.model'

export interface UpdateUserData {
  readonly name?: string
}

export interface UpdateUserUseCase {
  execute(id: string, data: UpdateUserData): Promise<UserModel>
}
