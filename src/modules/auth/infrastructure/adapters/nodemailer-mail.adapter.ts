import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

import type { MailConfig } from '@/common/config/mail.config'

import { MailPort } from '../../domain/ports/out/mail.port'

@Injectable()
export class NodemailerMailAdapter implements MailPort {
  private readonly logger = new Logger(NodemailerMailAdapter.name)
  private readonly transporter: Transporter
  private readonly mailConfig: MailConfig

  constructor(private readonly configService: ConfigService) {
    this.mailConfig = this.configService.get<MailConfig>('mail')!

    this.transporter = nodemailer.createTransport({
      host: this.mailConfig.HOST,
      port: this.mailConfig.PORT,
      secure: this.mailConfig.PORT === 465,
      auth:
        this.mailConfig.USER && this.mailConfig.PASSWORD
          ? {
              user: this.mailConfig.USER,
              pass: this.mailConfig.PASSWORD,
            }
          : undefined,
    })
  }

  async sendVerificationEmail(
    to: string,
    token: string,
    name: string,
  ): Promise<void> {
    const verificationUrl = `${this.mailConfig.VERIFICATION_URL}?token=${token}`

    await this.transporter.sendMail({
      from: this.mailConfig.FROM,
      to,
      subject: 'Verify your email address',
      html: `
        <h1>Hello ${name},</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
      `,
    })

    this.logger.log(`Verification email sent to ${to}`)
  }
}
