import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name').nullable()
      table.string('email').nullable().unique() // Nullable for guests
      table.timestamp('email_verified_at').nullable()
      table.string('avatar_url').nullable()
      table.enum('status', ['active', 'inactive']).defaultTo('active')
      table.timestamp('last_login_at').nullable()
      table.string('remember_token', 100).nullable()
      table.boolean('is_guest').notNullable().defaultTo(false)
      table.timestamp('guest_created_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    // Create user_identities table
    this.schema.createTable('user_identities', (table) => {
      table.increments('id').primary()
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('cascade')
      table.string('provider').notNullable() // google_oidc, email_otp, school_oidc, etc.
      table.string('provider_user_id').notNullable() // google sub, school subject, etc.
      table.string('email').nullable()
      table.boolean('email_verified').defaultTo(false)
      table.json('meta').nullable()
      table.timestamp('last_used_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['provider', 'provider_user_id'])
      table.index(['user_id'])
      table.index(['provider'])
    })
  }

  async down() {
    this.schema.dropTable('user_identities')
    this.schema.dropTable(this.tableName)
  }
}
