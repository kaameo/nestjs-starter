import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { randomUUID, randomBytes } from 'crypto'

import { BusinessException } from '@/common/exceptions/business.exception'

import {
  USER_REPOSITORY_PORT,
  UserRepositoryPort,
} from '../../../user/domain/ports/out/user-repository.port'
import { TokenPair } from '../models/token-pair.model'
import { HASH_PORT, HashPort } from '../ports/out/hash.port'
import { MAIL_PORT, MailPort } from '../ports/out/mail.port'
import {
  REFRESH_TOKEN_REPOSITORY_PORT,
  RefreshTokenRepositoryPort,
} from '../ports/out/refresh-token-repository.port'
import { TOKEN_PORT, TokenPort } from '../ports/out/token.port'

const GRACE_WINDOW_MS = 10_000 // 10 seconds

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject(USER_REPOSITORY_PORT)
    private readonly userRepository: UserRepositoryPort,
    @Inject(HASH_PORT)
    private readonly hashService: HashPort,
    @Inject(TOKEN_PORT)
    private readonly tokenService: TokenPort,
    @Inject(MAIL_PORT)
    private readonly mailService: MailPort,
    @Inject(REFRESH_TOKEN_REPOSITORY_PORT)
    private readonly refreshTokenRepository: RefreshTokenRepositoryPort,
  ) {}

  async signUp(data: {
    email: string
    password: string
    name: string
  }): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(data.email)
    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    const hashedPassword = await this.hashService.hash(data.password)
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    })

    await this.mailService.sendVerificationEmail(
      data.email,
      verificationToken,
      data.name,
    )
  }

  async signIn(data: {
    email: string
    password: string
    userAgent?: string
    ip?: string
  }): Promise<TokenPair> {
    const user = await this.userRepository.findByEmailWithPassword(data.email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await this.hashService.compare(
      data.password,
      user.password,
    )
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    if (!user.isEmailVerified()) {
      throw new BusinessException(
        'EMAIL_NOT_VERIFIED',
        HttpStatus.FORBIDDEN,
        'Email not verified',
      )
    }

    return this.generateAndStoreTokenPair(
      user.id,
      user.email,
      user.role,
      data.userAgent,
      data.ip,
    )
  }

  async verifyEmail(token: string): Promise<TokenPair> {
    const user = await this.userRepository.findByVerificationToken(token)
    if (!user) {
      throw new BusinessException(
        'TOKEN_INVALID',
        HttpStatus.BAD_REQUEST,
        'Invalid verification token',
      )
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BusinessException(
        'TOKEN_EXPIRED',
        HttpStatus.BAD_REQUEST,
        'Verification token has expired',
      )
    }

    const updatedUser = await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    })

    return this.generateAndStoreTokenPair(
      updatedUser.id,
      updatedUser.email,
      updatedUser.role,
    )
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email)
    if (!user) {
      // Silent return for security (don't reveal if email exists)
      return
    }

    if (user.isEmailVerified()) {
      return
    }

    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await this.userRepository.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
    })

    await this.mailService.sendVerificationEmail(
      email,
      verificationToken,
      user.name,
    )
  }

  async refreshToken(
    refreshTokenStr: string,
    userAgent?: string,
    ip?: string,
  ): Promise<TokenPair> {
    const payload = await this.tokenService.verifyRefreshToken(refreshTokenStr)
    const storedToken = await this.refreshTokenRepository.findByJti(payload.jti)

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token')
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired')
    }

    // Attempt atomic revocation (first-writer-wins)
    const newJti = randomUUID()
    const wasRevoked = await this.refreshTokenRepository.revokeByJti(
      payload.jti,
      newJti,
    )

    if (!wasRevoked) {
      // Token was already revoked - check grace window
      if (
        storedToken.revokedAt &&
        Date.now() - storedToken.revokedAt.getTime() < GRACE_WINDOW_MS
      ) {
        // Within grace window - find the replacement token and return it
        this.logger.warn(
          `Refresh token reuse within grace window: family=${storedToken.familyId}`,
        )
        // Return the already-issued replacement
        const user = await this.userRepository.findById(storedToken.userId)
        if (!user) throw new UnauthorizedException('User not found')

        return this.generateAndStoreTokenPair(
          user.id,
          user.email,
          user.role,
          userAgent,
          ip,
          storedToken.familyId,
        )
      }

      // Outside grace window - token reuse detected, revoke entire family
      this.logger.warn(
        `Refresh token reuse detected: family=${storedToken.familyId}`,
      )
      await this.refreshTokenRepository.revokeFamilyById(storedToken.familyId)
      throw new UnauthorizedException('Token reuse detected')
    }

    // Normal rotation: issue new token pair
    const user = await this.userRepository.findById(storedToken.userId)
    if (!user) throw new UnauthorizedException('User not found')

    return this.generateAndStoreTokenPair(
      user.id,
      user.email,
      user.role,
      userAgent,
      ip,
      storedToken.familyId,
    )
  }

  async signOut(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllByUserId(userId)
  }

  private async generateAndStoreTokenPair(
    userId: string,
    email: string,
    role: string,
    userAgent?: string,
    ip?: string,
    familyId?: string,
  ): Promise<TokenPair> {
    const jti = randomUUID()
    const family = familyId ?? randomUUID()

    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.generateAccessToken({ sub: userId, email, role }),
      this.tokenService.generateRefreshToken({ sub: userId, jti }),
    ])

    const tokenHash = await this.hashService.hash(refreshToken)

    await this.refreshTokenRepository.create({
      userId,
      jti,
      familyId: family,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      userAgent,
      ip,
    })

    return { accessToken, refreshToken }
  }
}
