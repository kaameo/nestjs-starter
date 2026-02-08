import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { Public } from '@/common/decorators/public.decorator'
import { JwtRefreshGuard } from '@/common/guards/jwt-refresh.guard'

import { RefreshTokenCommand } from '../../application/commands/refresh-token.command'
import { ResendVerificationCommand } from '../../application/commands/resend-verification.command'
import { SignInCommand } from '../../application/commands/sign-in.command'
import { SignOutCommand } from '../../application/commands/sign-out.command'
import { SignUpCommand } from '../../application/commands/sign-up.command'
import { VerifyEmailCommand } from '../../application/commands/verify-email.command'
import { ResendVerificationDto } from '../../application/dto/resend-verification.dto'
import { SignInDto } from '../../application/dto/sign-in.dto'
import { SignUpDto } from '../../application/dto/sign-up.dto'
import { TokenResponseDto } from '../../application/dto/token-response.dto'
import { VerifyEmailDto } from '../../application/dto/verify-email.dto'
import { TokenPair } from '../../domain/models/token-pair.model'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async signUp(@Body() dto: SignUpDto) {
    await this.commandBus.execute(new SignUpCommand(dto.email, dto.password, dto.name))
    return { message: 'Registration successful. Please verify your email.' }
  }

  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiOperation({ summary: 'Sign in with credentials' })
  @ApiBody({ type: SignInDto })
  @ApiResponse({ status: 200, description: 'Signed in successfully', type: TokenResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(
    @Body() dto: SignInDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const tokenPair = await this.commandBus.execute<SignInCommand, TokenPair>(
      new SignInCommand(dto.email, dto.password, req.headers['user-agent'], req.ip),
    )

    this.setRefreshTokenCookie(reply, tokenPair.refreshToken)

    return {
      accessToken: tokenPair.accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    }
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified', type: TokenResponseDto })
  async verifyEmailPost(
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const tokenPair = await this.commandBus.execute<VerifyEmailCommand, TokenPair>(
      new VerifyEmailCommand(dto.token),
    )

    this.setRefreshTokenCookie(reply, tokenPair.refreshToken)

    return {
      accessToken: tokenPair.accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    }
  }

  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email via link' })
  @ApiResponse({ status: 200, description: 'Email verified', type: TokenResponseDto })
  async verifyEmailGet(
    @Query('token') token: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const tokenPair = await this.commandBus.execute<VerifyEmailCommand, TokenPair>(
      new VerifyEmailCommand(token),
    )

    this.setRefreshTokenCookie(reply, tokenPair.refreshToken)

    return {
      accessToken: tokenPair.accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    }
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.commandBus.execute(new ResendVerificationCommand(dto.email))
    return {
      message: 'If the email exists and is not verified, a verification email has been sent.',
    }
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed', type: TokenResponseDto })
  async refresh(
    @CurrentUser() user: { sub: string; jti: string; refreshToken: string },
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const tokenPair = await this.commandBus.execute<RefreshTokenCommand, TokenPair>(
      new RefreshTokenCommand(user.refreshToken, req.headers['user-agent'], req.ip),
    )

    this.setRefreshTokenCookie(reply, tokenPair.refreshToken)

    return {
      accessToken: tokenPair.accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
    }
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out (revoke all tokens)' })
  @ApiResponse({ status: 200, description: 'Signed out successfully' })
  async signOut(
    @CurrentUser() user: { sub: string },
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.commandBus.execute(new SignOutCommand(user.sub))

    reply.clearCookie('refresh_token', {
      path: '/api/v1/auth/refresh',
    })

    return { message: 'Signed out successfully' }
  }

  private setRefreshTokenCookie(reply: FastifyReply, token: string): void {
    reply.setCookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
      maxAge: 604800, // 7 days in seconds
    })
  }
}
