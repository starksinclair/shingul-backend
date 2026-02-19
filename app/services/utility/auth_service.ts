import User from '#models/user'
import UserIdentity from '#models/user_identity'
import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import { EntitlementsService } from '#services/entitlements_service'

/**
 * Service for authentication operations
 */
export class AuthService {
  /**
   * Find or create a user by email
   */
  static async findOrCreateUser(email: string): Promise<User> {
    let user = await User.findBy('email', email.toLowerCase().trim())

    if (!user) {
      user = await User.create({
        email: email.toLowerCase().trim(),
        name: null,
        status: 'active',
        emailVerifiedAt: DateTime.now(),
        isGuest: false,
      })
    } else {
      // Update email verification if not already verified
      if (!user.emailVerifiedAt) {
        user.emailVerifiedAt = DateTime.now()
        await user.save()
      }
    }

    return user
  }

  /**
   * Find or create a user identity for email OTP provider
   */
  static async findOrCreateEmailIdentity(user: User, email: string): Promise<UserIdentity> {
    let identity = await UserIdentity.query()
      .where('user_id', user.id)
      .where('provider', 'email_otp')
      .first()

    if (!identity) {
      identity = await UserIdentity.create({
        userId: user.id,
        provider: 'email_otp',
        providerUserId: user.id,
        email: email.toLowerCase().trim(),
        emailVerified: true,
        meta: {
          email: email.toLowerCase().trim(),
        },
      })
    } else {
      // Update email verification
      if (!identity.emailVerified) {
        identity.emailVerified = true
        await identity.save()
      }
    }

    return identity
  }

  /**
   * Update user's last login time
   */
  static async updateLastLogin(user: User): Promise<void> {
    user.lastLoginAt = DateTime.now()
    await user.save()
  }

  /**
   * Authenticate a user and create a session
   */
  static async authenticateUser(user: User, ctx: HttpContext): Promise<void> {
    await ctx.auth.use('web').login(user)
  }

  /**
   * Complete the magic link authentication flow
   * Handles guest upgrade: if user is already authenticated and is a guest,
   * upgrade them to registered user instead of creating a new user
   */
  static async completeMagicLinkAuth(
    email: string,
    ctx: HttpContext
  ): Promise<{ user: User; identity: UserIdentity }> {
    const normalizedEmail = email.toLowerCase().trim()
    let user: User

    // Check if there's already an authenticated guest user
    const currentUser = ctx.auth.user
    if (currentUser && currentUser.isGuest) {
      // Upgrade guest to registered user
      user = currentUser
      user.email = normalizedEmail
      user.emailVerifiedAt = DateTime.now()
      user.isGuest = false
      await user.save()

      // Upgrade entitlements
      await EntitlementsService.upgradeToRegistered(user.id)
    } else {
      // Normal flow: find or create user by email
      user = await this.findOrCreateUser(normalizedEmail)
    }

    // Find or create email identity
    const identity = await this.findOrCreateEmailIdentity(user, normalizedEmail)

    // Update last login
    await this.updateLastLogin(user)

    // Authenticate user (create/update session)
    await this.authenticateUser(user, ctx)

    return { user, identity }
  }
}
