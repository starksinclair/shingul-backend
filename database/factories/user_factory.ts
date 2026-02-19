import factory from '@adonisjs/lucid/factories'
import User from '#models/user'
import { DateTime } from 'luxon'
import { UserIdentityFactory } from './user_identity_factory.js'

export const UserFactory = factory
  .define(User, async ({ faker }) => {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerifiedAt: faker.datatype.boolean() ? DateTime.now() : null,
      avatarUrl: faker.image.avatar(),
      status: faker.helpers.arrayElement(['active', 'inactive'] as const),
      lastLoginAt: faker.datatype.boolean()
        ? DateTime.now().minus({ days: faker.number.int({ min: 0, max: 30 }) })
        : null,
      rememberToken: null,
      isGuest: false,
      guestCreatedAt: null,
    }
  })
  .state('active', (user) => (user.status = 'active'))
  .state('inactive', (user) => (user.status = 'inactive'))
  .state('verified', (user) => (user.emailVerifiedAt = DateTime.now()))
  .state('unverified', (user) => (user.emailVerifiedAt = null))
  .state('guest', (user) => {
    user.isGuest = true
    user.guestCreatedAt = DateTime.now()
    user.email = null
  })
  .relation('identities', () => UserIdentityFactory)
  .build()
