export interface ResendVerificationUseCase {
  execute(email: string): Promise<void>
}
