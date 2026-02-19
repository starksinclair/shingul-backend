import factory from '@adonisjs/lucid/factories'
import UserIdentity from '#models/user_identity'
import { DateTime } from 'luxon'

export const UserIdentityFactory = factory
  .define(UserIdentity, async ({ faker }) => {
    return {
      provider: faker.helpers.arrayElement(['google_oidc', 'email_otp', 'school_oidc']),
      providerUserId: faker.number.int({ min: 1, max: 1000000 }),
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(),
      meta: {
        sub: faker.string.alphanumeric(20),
        email: faker.internet.email(),
        name: faker.person.fullName(),
      },
      lastUsedAt: faker.datatype.boolean()
        ? DateTime.now().minus({ hours: faker.number.int({ min: 1, max: 720 }) })
        : null,
    }
  })
  .state('verified', (identity) => (identity.emailVerified = true))
  .state('unverified', (identity) => (identity.emailVerified = false))
  .state('google', async (identity, { faker }) => {
    identity.provider = 'google_oidc'
    identity.providerUserId = faker.number.int({ min: 1, max: 1000000 })
  })
  .state('email', (identity) => {
    identity.provider = 'email_otp'
  })
  .state('school', (identity) => {
    identity.provider = 'school_oidc'
  })
  .build()
