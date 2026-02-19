import type { HttpContext } from '@adonisjs/core/http'
import { MagicLinkService } from '#services/utility/magic_link_service'
import { serviceContainer } from '#services/service_container'
import { AuthService } from '#services/utility/auth_service'
import env from '#start/env'
import vine from '@vinejs/vine'

/**
 * Controller for email-based magic link authentication
 */
export default class AuthController {
  async start({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        email: vine.string().email().trim().normalizeEmail(),
      })
    )

    const { email } = await request.validateUsing(validator)

    // Check rate limiting (1 email per minute)
    const isRateLimited = await serviceContainer.rateLimitService.isRateLimited(email, 1)

    if (isRateLimited) {
      const timeRemaining = await serviceContainer.rateLimitService.getTimeRemaining(email, 1)
      return response.tooManyRequests({
        message: 'Please wait before requesting another magic link',
        retryAfter: timeRemaining,
      })
    }

    try {
      // Generate token and create login link
      const { token } = await MagicLinkService.createMagicLink(email, request.ctx!, 10)

      // Send email with magic link
      await serviceContainer.emailService.sendMagicLink(email, token)

      return response.ok({
        message: 'Magic link sent to your email',
        // In development, include the token for testing
        ...(process.env.NODE_ENV === 'development' && { token }),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to send magic link',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * GET /api/auth/email/callback?token=XXX
   * Handle the magic link callback
   */
  async callback({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        token: vine.string().trim(),
      })
    )
    const { token } = await request.validateUsing(validator)

    // Verify token
    const { valid, loginLink, reason } = await MagicLinkService.verifyAndConsumeToken(token)

    if (!valid || !loginLink) {
      const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'
      console.log(reason)
      return response.redirect(`${frontendUrl}/?status=error&message=${reason || 'Invalid token'}`)
    }

    try {
      // Complete authentication flow
      await AuthService.completeMagicLinkAuth(loginLink.email, request.ctx!)

      // Redirect to frontend with success status
      const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'
      return response.redirect(`${frontendUrl}/?status=ok`)
    } catch (error) {
      const frontendUrl = env.get('FRONTEND_URL') || 'http://localhost:3000'
      console.log(error)
      return response.redirect(
        `${frontendUrl}/?status=error&message=${error instanceof Error ? error.message : 'Authentication failed'}`
      )
    }
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.user
    return response.ok({ user: user ? user.serialize() : null })
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.ok({ ok: true })
  }
}
