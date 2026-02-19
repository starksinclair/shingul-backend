/**
 * Interface for rate limiting services
 * Allows swapping between different rate limit stores (Redis, Database, Memory, etc.)
 */
export interface RateLimitServiceInterface {
  /**
   * Check if an email has exceeded the rate limit
   * @param email - The email address to check
   * @param limitMinutes - The number of minutes between allowed requests
   * @returns true if rate limited, false otherwise
   */
  isRateLimited(email: string, limitMinutes?: number): Promise<boolean>

  /**
   * Get the time remaining until the rate limit expires
   * @param email - The email address to check
   * @param limitMinutes - The number of minutes between allowed requests
   * @returns Number of seconds remaining, or 0 if not rate limited
   */
  getTimeRemaining(email: string, limitMinutes?: number): Promise<number>
}
