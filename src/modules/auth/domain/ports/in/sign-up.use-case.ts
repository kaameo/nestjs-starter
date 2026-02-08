export interface SignUpData {
  readonly email: string
  readonly password: string
  readonly name: string
}

export interface SignUpUseCase {
  execute(data: SignUpData): Promise<void>
}
