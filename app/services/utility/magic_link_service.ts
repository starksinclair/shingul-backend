import LoginLink from '#models/login_link'
import { TokenService } from '../token_service.js'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Service for managing magic link authentication
 */
export class MagicLinkService {
  /**
   * Create a new magic link for an email
   */
  static async createMagicLink(
    email: string,
    ctx: HttpContext,
    expirationMinutes: number = 10
  ): Promise<{ token: string; loginLink: LoginLink }> {
    const token = TokenService.generateToken()
    const tokenHash = TokenService.hashToken(token)

    const expiresAt = DateTime.now().plus({ minutes: expirationMinutes })

    const loginLink = await LoginLink.create({
      email: email.toLowerCase().trim(),
      tokenHash,
      expiresAt,
      attempts: 0,
      ip: ctx.request.ip(),
      userAgent: ctx.request.header('user-agent') || null,
    })

    return { token, loginLink }
  }

  /**
   * Find a login link by token
   */
  static async findLoginLinkByToken(token: string): Promise<LoginLink | null> {
    const tokenHash = TokenService.hashToken(token)

    return await LoginLink.query().where('token_hash', tokenHash).whereNull('consumed_at').first()
  }

  /**
   * Verify and consume a magic link token
   */
  static async verifyAndConsumeToken(
    token: string,
    maxAttempts: number = 5
  ): Promise<{ valid: boolean; loginLink: LoginLink | null; reason?: string }> {
    const loginLink = await this.findLoginLinkByToken(token)

    if (!loginLink) {
      return { valid: false, loginLink: null, reason: 'Invalid token' }
    }

    // Increment attempts for brute force protection
    await loginLink.incrementAttempts()

    if (loginLink.hasExceededMaxAttempts(maxAttempts)) {
      return { valid: false, loginLink, reason: 'Too many attempts' }
    }

    if (loginLink.isExpired()) {
      return { valid: false, loginLink, reason: 'Token expired' }
    }

    if (loginLink.isConsumed()) {
      return { valid: false, loginLink, reason: 'Token already used' }
    }

    // Mark as consumed
    await loginLink.markAsConsumed()

    return { valid: true, loginLink }
  }
}
