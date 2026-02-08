export interface SignOutUseCase {
  execute(userId: string): Promise<void>
}
