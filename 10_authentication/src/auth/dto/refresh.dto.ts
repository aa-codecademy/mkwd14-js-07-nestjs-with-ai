import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

/**
 * RefreshDto — the body sent to POST /api/auth/refresh to exchange a
 * refresh token for a new access + refresh token pair.
 *
 * WHY DO WE NEED A REFRESH TOKEN AT ALL?
 * Access tokens (JWTs) are short-lived (e.g. 60 seconds in dev, 15 minutes
 * in production). Once they expire, the user would have to log in again.
 * Refresh tokens solve this: they are long-lived tokens stored securely by
 * the client and sent ONLY to the /refresh endpoint to get a new access token.
 *
 * WHY TWO SEPARATE TOKENS?
 *   Access token  → short-lived, sent on EVERY API request (higher exposure risk)
 *   Refresh token → long-lived, sent ONLY to /refresh (much lower exposure risk)
 *
 * WHY DO WE NEED userId IN THE REQUEST BODY?
 * The refresh token itself is a JWT signed with a different secret
 * (JWT_REFRESH_SECRET). We need the userId to look up the user in the database
 * and verify the stored refresh token hash. Without the userId we would need
 * to decode the token first to find the user — sending it explicitly is simpler
 * and avoids an extra decoding step.
 *
 * HOW REFRESH TOKEN ROTATION WORKS (implemented in AuthService.refresh):
 *   1. Client sends { userId, refreshToken }
 *   2. Server looks up the user, checks refreshTokenHash + expiry in DB
 *   3. Server issues a brand-new access token AND a brand-new refresh token
 *   4. Server saves the new refresh token hash (old one is now invalid)
 *   5. Client replaces both stored tokens
 *
 * Rotation means a stolen refresh token can only be used ONCE before it is
 * superseded. If an attacker and the real user both try to use the same token,
 * only the first call succeeds — a good signal that the token was compromised.
 */
export class RefreshDto {
  @ApiProperty({
    description: 'The ID of the user to refresh tokens for',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    description: 'The refresh token issued during login',
  })
  @IsString()
  refreshToken!: string;
}
