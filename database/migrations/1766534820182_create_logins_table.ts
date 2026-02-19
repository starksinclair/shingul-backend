import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'login_links'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email').notNullable().index()
      table.string('token_hash', 64).notNullable().index()
      table.timestamp('expires_at').notNullable()
      table.timestamp('consumed_at').nullable()
      table.smallint('attempts').defaultTo(0)
      table.string('ip').nullable()
      table.string('user_agent').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['email', 'expires_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
