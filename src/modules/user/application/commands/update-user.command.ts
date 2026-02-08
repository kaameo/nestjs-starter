export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly data: { name?: string },
  ) {}
}
