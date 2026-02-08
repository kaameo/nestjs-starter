import { UserModel } from '../../models/user.model'

export interface GetUserUseCase {
  execute(id: string): Promise<UserModel>
}
