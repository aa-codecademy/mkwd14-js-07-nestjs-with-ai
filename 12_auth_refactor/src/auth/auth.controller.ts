import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { User } from '../user/user.entity';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './types/auth-user';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * AuthController — HTTP entry point for all authentication endpoints.
 *
 * WHY /auth AS THE PREFIX?
 * Convention groups auth endpoints under a dedicated path so they stand apart
 * from resource endpoints (/api/artist, /api/song, …).
 * Full paths become: POST /api/auth/register  and  POST /api/auth/login.
 *
 * WHY ARE THESE NOT PROTECTED BY JwtAuthGuard?
 * Register and login are the two endpoints that ISSUE credentials. A user
 * has no token yet, so guarding them would make it impossible to ever log in.
 * All other endpoints that need authentication will use @UseGuards(JwtAuthGuard).
 *
 * NOTE ON SWAGGER DECORATORS:
 * @ApiTags, @ApiOperation, @ApiCreatedResponse, etc. are purely documentation —
 * they have zero effect on runtime behavior. They tell Swagger UI what
 * responses this endpoint can return so developers can explore the API at /docs.
 */
@ApiTags('Authentication')
// @Public() - we can use this here only when all routes are public
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/register
   *
   * Creates a new user account. The user provides email + password and gets
   * back the saved User record (without the password hash — that field has
   * { select: false } on the entity column).
   *
   * HTTP 201 Created is more correct than 200 OK here because we are creating
   * a new resource (@Post returns 201 by default in NestJS).
   * HTTP 409 Conflict is returned when the email already exists (thrown by
   * UserService.createUser).
   */
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'The user has been successfully registered.',
    type: User,
  })
  @ApiConflictResponse({
    description: 'Email is already in use.',
  })
  @Public()
  @Post('register')
  register(@Body() credentials: RegisterDto): Promise<User> {
    // @Body() extracts and deserializes the request body JSON into a RegisterDto
    // instance. The global ValidationPipe has already validated it before this
    // method runs — if validation failed, this line is never reached.
    return this.authService.register(credentials);
  }

  /**
   * POST /api/auth/login
   *
   * Authenticates an existing user. Returns { user, accessToken } on success.
   * The accessToken is a signed JWT the client must include in all subsequent
   * protected requests as: Authorization: Bearer <accessToken>
   *
   * HTTP 400 Bad Request is returned for both "user not found" and "wrong
   * password" — we deliberately use the same error message ("Invalid credentials")
   * to prevent user enumeration attacks. If we returned "user not found" for
   * unknown emails, an attacker could probe which emails are registered.
   */
  @ApiOperation({ summary: 'Login a user' })
  @ApiOkResponse({
    description: 'The user has been successfully logged in.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid credentials.',
  })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('login')
  login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials);
  }

  /**
   * POST /api/auth/refresh
   *
   * Exchanges a valid refresh token for a new access + refresh token pair.
   * The client must send both the userId and the refresh token received from
   * the most recent login or refresh call.
   *
   * This implements "refresh token rotation":
   *   - The old refresh token is invalidated immediately after use.
   *   - The response contains BOTH a new access token AND a new refresh token.
   *   - The client must store the new refresh token for the next refresh call.
   *
   * HTTP 401 Unauthorized is returned when the refresh token is expired,
   * tampered with, or does not match the stored hash for the given userId.
   */
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({
    description: 'Access token refreshed successfully. Token pair returned.',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token.',
  })
  @HttpCode(HttpStatus.OK)
  @Public()
  @Post('refresh')
  refresh(@Body() body: RefreshDto) {
    return this.authService.refresh(body);
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout user - revoke the refresh token' })
  @ApiOkResponse({ description: 'User has been successfully logged out' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@CurrentUser() user: AuthUser) {
    console.log('🚀 ~ AuthController ~ logout ~ user:', user);
    if (user?.id) {
      await this.authService.logout(user.id);
    }

    return { message: 'Logged out successfully.' };
  }

  @ApiOperation({ summary: 'Request a password reset code' })
  @ApiOkResponse({
    description: 'Reset code issued',
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.forgotPassword(body.email);
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiOkResponse({
    description: 'Password has been reset',
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(body);
  }
}
