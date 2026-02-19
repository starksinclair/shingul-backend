import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class LoginLink extends BaseModel {
  static table = 'login_links'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column({ columnName: 'token_hash' })
  declare tokenHash: string

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime

  @column.dateTime({ columnName: 'consumed_at' })
  declare consumedAt: DateTime | null

  @column()
  declare attempts: number

  @column()
  declare ip: string | null

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /**
   * Check if the login link is expired
   */
  isExpired(): boolean {
    return this.expiresAt < DateTime.now()
  }

  /**
   * Check if the login link has been consumed
   */
  isConsumed(): boolean {
    return this.consumedAt !== null
  }

  /**
   * Check if the login link has exceeded max attempts (brute force protection)
   */
  hasExceededMaxAttempts(maxAttempts: number = 5): boolean {
    return this.attempts >= maxAttempts
  }

  /**
   * Check if the login link is valid (not expired, not consumed, not brute-forced)
   */
  isValid(maxAttempts: number = 5): boolean {
    return !this.isExpired() && !this.isConsumed() && !this.hasExceededMaxAttempts(maxAttempts)
  }

  /**
   * Mark the login link as consumed
   */
  async markAsConsumed() {
    this.consumedAt = DateTime.now()
    await this.save()
  }

  /**
   * Increment the attempts counter
   */
  async incrementAttempts() {
    this.attempts++
    await this.save()
  }
}
