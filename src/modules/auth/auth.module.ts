import { Module, forwardRef } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import type { JwtConfig } from '@/common/config/jwt.config'

import { RefreshTokenHandler } from './application/commands/refresh-token.handler'
import { ResendVerificationHandler } from './application/commands/resend-verification.handler'
import { SignInHandler } from './application/commands/sign-in.handler'
import { SignOutHandler } from './application/commands/sign-out.handler'
import { SignUpHandler } from './application/commands/sign-up.handler'
import { VerifyEmailHandler } from './application/commands/verify-email.handler'
import { HASH_PORT } from './domain/ports/out/hash.port'
import { MAIL_PORT } from './domain/ports/out/mail.port'
import { REFRESH_TOKEN_REPOSITORY_PORT } from './domain/ports/out/refresh-token-repository.port'
import { TOKEN_PORT } from './domain/ports/out/token.port'
import { AuthService } from './domain/services/auth.service'
import { Argon2HashAdapter } from './infrastructure/adapters/argon2-hash.adapter'
import { DrizzleRefreshTokenRepositoryAdapter } from './infrastructure/adapters/drizzle-refresh-token-repository.adapter'
import { JwtTokenAdapter } from './infrastructure/adapters/jwt-token.adapter'
import { NodemailerMailAdapter } from './infrastructure/adapters/nodemailer-mail.adapter'
import { AuthController } from './infrastructure/controllers/auth.controller'
import { JwtRefreshStrategy } from './infrastructure/strategies/jwt-refresh.strategy'
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy'
import { UserModule } from '../user/user.module'

const CommandHandlers = [
  SignUpHandler,
  SignInHandler,
  VerifyEmailHandler,
  ResendVerificationHandler,
  RefreshTokenHandler,
  SignOutHandler,
]

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwt = config.get<JwtConfig>('jwt')!
        return {
          secret: jwt.SECRET,
          signOptions: { expiresIn: jwt.EXPIRATION as any },
        }
      },
    }),
    CqrsModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: HASH_PORT, useClass: Argon2HashAdapter },
    { provide: TOKEN_PORT, useClass: JwtTokenAdapter },
    { provide: MAIL_PORT, useClass: NodemailerMailAdapter },
    { provide: REFRESH_TOKEN_REPOSITORY_PORT, useClass: DrizzleRefreshTokenRepositoryAdapter },
    JwtStrategy,
    JwtRefreshStrategy,
    ...CommandHandlers,
  ],
  exports: [AuthService],
})
export class AuthModule {}
