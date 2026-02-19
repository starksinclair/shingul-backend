import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import UserIdentity from './user_identity.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string | null

  @column()
  declare email: string | null

  @column.dateTime({ columnName: 'email_verified_at' })
  declare emailVerifiedAt: DateTime | null

  @column({ columnName: 'avatar_url' })
  declare avatarUrl: string | null

  @column()
  declare status: 'active' | 'inactive'

  @column.dateTime({ columnName: 'last_login_at' })
  declare lastLoginAt: DateTime | null

  @column({ serializeAs: null, columnName: 'remember_token' })
  declare rememberToken: string | null

  @column({ columnName: 'is_guest' })
  declare isGuest: boolean

  @column.dateTime({ columnName: 'guest_created_at' })
  declare guestCreatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => UserIdentity, {
    foreignKey: 'userId',
  })
  declare identities: HasMany<typeof UserIdentity>
}
