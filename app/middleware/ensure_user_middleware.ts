import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import User from '#models/user'
import { EntitlementsService } from '#services/entitlements_service'
import { ulid } from 'ulid'
import { DateTime } from 'luxon'

/**
 * Middleware to ensure a user exists for mutating routes
 * Creates a guest user if no authenticated user exists
 */
export default class EnsureUserMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()

    // If user is already authenticated, continue
    if (ctx.auth.user) {
      return next()
    }

    // Create a guest user
    const guestEmail = `guest_${ulid()}@guest.local`
    const guestUser = await User.create({
      email: guestEmail,
      name: null,
      status: 'active',
      isGuest: true,
      guestCreatedAt: DateTime.now(),
      emailVerifiedAt: null,
    })

    // Grant default guest entitlements
    await EntitlementsService.grantDefaultGuest(guestUser.id)

    // Log in the guest user
    await ctx.auth.use('web').login(guestUser)

    // Continue with the request
    return next()
  }
}
