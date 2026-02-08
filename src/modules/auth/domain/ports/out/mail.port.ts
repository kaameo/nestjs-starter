export interface MailPort {
  sendVerificationEmail(to: string, token: string, name: string): Promise<void>
}

export const MAIL_PORT = Symbol('MAIL_PORT')
