/* eslint-disable */
export default async () => {
  const t = {}
  return {
    '@nestjs/swagger': {
      models: [
        [
          import('./modules/auth/application/dto/resend-verification.dto'),
          {
            ResendVerificationDto: {
              email: { required: true, type: () => String, format: 'email' },
            },
          },
        ],
        [
          import('./modules/auth/application/dto/sign-in.dto'),
          {
            SignInDto: {
              email: { required: true, type: () => String, format: 'email' },
              password: { required: true, type: () => String },
            },
          },
        ],
        [
          import('./modules/auth/application/dto/sign-up.dto'),
          {
            SignUpDto: {
              email: { required: true, type: () => String, format: 'email' },
              password: { required: true, type: () => String, minLength: 8, maxLength: 128 },
              name: { required: true, type: () => String, maxLength: 100 },
            },
          },
        ],
        [
          import('./modules/auth/application/dto/token-response.dto'),
          {
            TokenResponseDto: {
              accessToken: { required: true, type: () => String },
              tokenType: { required: true, type: () => String, default: 'Bearer' },
              expiresIn: { required: true, type: () => Number },
            },
          },
        ],
        [
          import('./modules/auth/application/dto/verify-email.dto'),
          { VerifyEmailDto: { token: { required: true, type: () => String } } },
        ],
        [
          import('./modules/user/application/dto/update-user.dto'),
          { UpdateUserDto: { name: { required: false, type: () => String, maxLength: 100 } } },
        ],
        [
          import('./modules/user/application/dto/user-response.dto'),
          {
            UserResponseDto: {
              id: { required: true, type: () => String },
              email: { required: true, type: () => String },
              name: { required: true, type: () => String },
              role: { required: true, type: () => String },
              emailVerified: { required: true, type: () => Boolean },
              createdAt: { required: true, type: () => Date },
              updatedAt: { required: true, type: () => Date },
            },
          },
        ],
      ],
      controllers: [
        [
          import('./modules/auth/infrastructure/controllers/auth.controller'),
          {
            AuthController: {
              signUp: {},
              signIn: {},
              verifyEmailPost: {},
              verifyEmailGet: {},
              resendVerification: {},
              refresh: {},
              signOut: {},
            },
          },
        ],
        [
          import('./modules/user/infrastructure/controllers/user.controller'),
          {
            UserController: {
              getMe: { type: Object },
              updateMe: { type: Object },
              getMyPosts: {},
              listUsers: { type: Object },
              getUser: { type: Object },
              deleteUser: {},
            },
          },
        ],
        [
          import('./modules/health/health.controller'),
          { HealthController: { liveness: {}, readiness: {} } },
        ],
      ],
    },
  }
}
