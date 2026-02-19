import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class UserIdentity extends BaseModel {
  static table = 'user_identities'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare provider: string // google_oidc, email_otp, school_oidc, etc.

  @column({ columnName: 'provider_user_id' })
  declare providerUserId: number // google sub, school subject, etc.

  @column()
  declare email: string | null

  @column({ columnName: 'email_verified' })
  declare emailVerified: boolean

  @column({
    prepare: (value: Record<string, any> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | Record<string, any> | null) => {
      if (value === null || value === undefined) {
        return null
      }
      // PostgreSQL JSON columns return objects directly, not strings
      if (typeof value === 'object') {
        return value
      }
      // If it's a string, parse it
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare meta: Record<string, any> | null

  @column.dateTime({ columnName: 'last_used_at' })
  declare lastUsedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
