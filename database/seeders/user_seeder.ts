import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { UserFactory } from '../factories/user_factory.js'
import { UserIdentityFactory } from '../factories/user_identity_factory.js'

export default class extends BaseSeeder {
  async run() {
    // Create 10 users, each with 1-3 identities
    const users = await UserFactory.apply('active').apply('verified').createMany(10)

    // Create identities for each user
    for (const user of users) {
      const identityCount = Math.floor(Math.random() * 3) + 1 // 1-3 identities per user
      const providers: Array<'google' | 'email' | 'school'> = ['google', 'email', 'school']

      for (let i = 0; i < identityCount; i++) {
        const provider = providers[i % providers.length]
        await UserIdentityFactory.merge({ userId: user.id })
          .apply(provider)
          .apply('verified')
          .create()
      }
    }
  }
}
