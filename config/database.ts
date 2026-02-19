import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: app.inTest ? env.get('TEST_DB_HOST', 'localhost') : env.get('DB_HOST'),
        port: app.inTest ? env.get('TEST_DB_PORT', env.get('DB_PORT')) : env.get('DB_PORT'),
        user: app.inTest ? env.get('TEST_DB_USER', env.get('DB_USER', '')) : env.get('DB_USER', ''),
        password: app.inTest
          ? env.get('TEST_DB_PASSWORD', env.get('DB_PASSWORD', ''))
          : env.get('DB_PASSWORD', ''),
        database: app.inTest
          ? env.get('TEST_DB_DATABASE', env.get('DB_DATABASE', ''))
          : env.get('DB_DATABASE', ''),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
