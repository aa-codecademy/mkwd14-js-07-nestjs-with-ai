---
applyTo: "src/**/*.ts"
---

# Security Rules — Copilot Instructions

These instructions apply to all TypeScript source files in `src/`. They encode the security decisions made deliberately in this project — follow them exactly.

---

## Password Hashing — bcrypt Only

**Never** store plain-text passwords. **Never** use fast hashes (MD5, SHA-1, SHA-256) for passwords.

Always use `bcrypt.hash(password, 10)`:

```typescript
// ✅ Correct — slow, salted, resistant to brute-force
const passwordHash = await bcrypt.hash(credentials.password, 10);

// ❌ Wrong — fast hash, trivially brute-forced
const hash = crypto.createHash('sha256').update(password).digest('hex');
```

**Why cost factor 10?** It is the OWASP-recommended minimum (~100 ms per hash on modern hardware). Higher values slow login noticeably; lower values make brute-forcing cheaper.

**Why bcrypt auto-salts?** Each call to `bcrypt.hash` generates a random salt and embeds it in the output. Two identical passwords produce completely different hashes — a rainbow-table attack is useless.

---

## Refresh Token Hashing

Refresh tokens must also be stored as bcrypt hashes — **never as raw strings**:

```typescript
// ✅ Correct — even if the DB is dumped, sessions cannot be hijacked
const hashedToken = await bcrypt.hash(refreshToken, 10);
await this.userRepository.update(userId, { refreshTokenHash: hashedToken });

// ❌ Wrong — a DB dump hands an attacker all active sessions
await this.userRepository.update(userId, { refreshTokenHash: refreshToken });
```

The same principle applies to `resetPasswordHash` — the password reset code is stored as a bcrypt hash.

---

## Password Verification — bcrypt.compare Only

Use `bcrypt.compare` to verify passwords. It extracts the embedded salt from the stored hash and re-runs bcrypt with that salt before comparing:

```typescript
// ✅ Correct — constant-time, timing-attack-safe
const isValid = await bcrypt.compare(candidatePassword, storedHash);

// ❌ Wrong — re-hashing will produce a different hash because bcrypt uses a random salt each time
const hashOfInput = await bcrypt.hash(candidatePassword, 10);
const isValid = hashOfInput === storedHash; // always false
```

`bcrypt.compare` is constant-time — it does not short-circuit when hashes differ, which prevents timing attacks.

---

## User Enumeration Protection

Auth error messages must **never** distinguish between "user not found" and "wrong password". An attacker who can tell the difference can enumerate which emails are registered.

```typescript
// ✅ Correct — both failure modes return the same message
catch (error) {
  this.logger.error('Login error', JSON.stringify(error)); // log the real reason
  throw new BadRequestException('Invalid credentials');    // generic public message
}

// ❌ Wrong — leaks whether the email exists
if (!user) throw new NotFoundException('User not found');
if (!passwordMatch) throw new BadRequestException('Wrong password');
```

Apply the same rule to:
- **Forgot-password** — always return `"If a user with that email exists, a reset link has been sent."` regardless of whether the email is registered.
- **Token refresh** — always return `"Invalid or expired token"` regardless of whether the user ID exists.
- **Password reset** — always return `"Invalid or expired reset code."` regardless of why the code failed.

---

## `select: false` Columns — Never Read Without QueryBuilder

The following `User` entity columns are **excluded from all default SELECT queries** because they hold secrets:

| Column | Reason |
|--------|--------|
| `passwordHash` | Bcrypt hash — only needed during login/registration |
| `refreshTokenHash` | Bcrypt hash — only needed during token refresh |
| `refreshTokenExpiry` | Paired with hash — only needed during token refresh |
| `resetPasswordHash` | Bcrypt hash — only needed during password reset |
| `resetPasswordExpiry` | Paired with hash — only needed during password reset |

To read one of these columns you **must** use `createQueryBuilder` with `.addSelect('user.columnName')`:

```typescript
// ✅ Correct — explicitly opts in the hidden column
const user = await this.userRepository
  .createQueryBuilder('user')
  .addSelect('user.passwordHash')
  .where('user.email = :email', { email })
  .getOne();

// ❌ Wrong — returns undefined for passwordHash because of select:false
const user = await this.userRepository.findOneBy({ email });
// user.passwordHash === undefined → bcrypt.compare will throw
```

**Never** remove `select: false` from these columns — it is the last line of defence against accidental exposure in logs and API responses.

---

## Token Secrets Must Come from Environment Variables

Never hard-code JWT secrets in source code:

```typescript
// ✅ Correct — secret comes from .env, never committed to git
const accessToken = await this.jwtService.signAsync(payload, {
  secret: this.configService.get<string>('JWT_SECRET'),
});

// ❌ Wrong — secret is in source code, visible in git history
const accessToken = await this.jwtService.signAsync(payload, {
  secret: 'my-super-secret',
});
```

Ensure `.env` is listed in `.gitignore`. Use `.env.example` (with dummy values) to document required variables.

---

## JWT Algorithm

This project signs tokens with **HS256** (HMAC-SHA256), a symmetric algorithm. The same secret is used to both sign and verify. This is appropriate when a single service does both.

If verification ever moves to a separate service, switch to **RS256** (asymmetric) — only the auth server holds the private key, while verifiers only need the public key.

Do not change the algorithm without updating both `JwtModule` configuration and `JwtStrategy.super({ algorithms: [...] })`.

---

## Sensitive Fields Must Not Appear in API Responses

The `User` entity columns marked `select: false` will be `undefined` on objects returned by standard TypeORM queries — so they will not appear in JSON responses automatically. Preserve this:

- Do **not** add `@ApiProperty()` to `passwordHash`, `refreshTokenHash`, or `resetPasswordHash`.
- Do **not** spread or serialize a `User` object after performing a `createQueryBuilder` query that opted in hidden columns — those fields will now be populated.
- Return the user object only **after** all sensitive operations are complete, or return only the safe subset via an `AuthUser` / response DTO.

---

## One-Time Codes (Password Reset)

Reset codes are **single-use and time-limited**:

1. After a successful password reset, `resetPasswordHash` and `resetPasswordExpiry` are set to `null`.
2. A code that has been used once cannot be replayed.
3. In production, reset codes should only ever be delivered via email — never returned in the API response body.

In this project they are returned in the response for development convenience. Remove that before shipping to production.
