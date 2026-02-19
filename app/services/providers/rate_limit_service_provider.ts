import LoginLink from '#models/login_link'
import { DateTime } from 'luxon'
import type { RateLimitServiceInterface } from '../interfaces/rate_limit_service_interface.js'

/**
 * Database-based rate limit service implementation
 * Uses the login_links table to track rate limits
 * Can be swapped for Redis-based implementation for better performance
 */
export class RateLimitServiceProvider implements RateLimitServiceInterface {
  /**
   * Check if an email has exceeded the rate limit
   */
  async isRateLimited(email: string, limitMinutes: number = 1): Promise<boolean> {
    const cutoffTime = DateTime.now().minus({ minutes: limitMinutes })

    const recentLink = await LoginLink.query()
      .where('email', email)
      .where('created_at', '>', cutoffTime.toSQL()!)
      .first()

    return recentLink !== null
  }

  /**
   * Get the time remaining until the rate limit expires
   */
  async getTimeRemaining(email: string, limitMinutes: number = 1): Promise<number> {
    const cutoffTime = DateTime.now().minus({ minutes: limitMinutes })

    const recentLink = await LoginLink.query()
      .where('email', email)
      .where('created_at', '>', cutoffTime.toSQL()!)
      .orderBy('created_at', 'desc')
      .first()

    if (!recentLink) {
      return 0
    }

    const expiresAt = recentLink.createdAt.plus({ minutes: limitMinutes })
    const remaining = expiresAt.diff(DateTime.now(), 'seconds').seconds

    return Math.max(0, Math.ceil(remaining))
  }
}
