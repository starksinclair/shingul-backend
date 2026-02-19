import { test } from '@japa/runner'
import { AuthService } from '#services/utility/auth_service'
import User from '#models/user'
import UserIdentity from '#models/user_identity'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('AuthService', (group) => {
  group.each.setup(async () => {
    await UserIdentity.query().delete()
    await User.query().delete()
  })

  test('should create new user if not exists', async ({ assert }) => {
    const user = await AuthService.findOrCreateUser('newuser@example.com')

    assert.instanceOf(user, User)
    assert.equal(user.email, 'newuser@example.com')
    assert.isNotNull(user.emailVerifiedAt)
    assert.equal(user.status, 'active')
  })

  test('should find existing user', async ({ assert }) => {
    const existingUser = await User.create({
      email: 'existing@example.com',
      name: 'Existing User',
      status: 'active',
    })

    const user = await AuthService.findOrCreateUser('existing@example.com')

    assert.equal(user.id, existingUser.id)
    assert.equal(user.email, existingUser.email)
  })

  test('should verify email if user exists but not verified', async ({ assert }) => {
    await User.create({
      email: 'unverified@example.com',
      name: 'Unverified User',
      status: 'active',
      emailVerifiedAt: null,
    })

    const verifiedUser = await AuthService.findOrCreateUser('unverified@example.com')

    assert.isNotNull(verifiedUser.emailVerifiedAt)
  })

  test('should create email identity if not exists', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      status: 'active',
    })

    const identity = await AuthService.findOrCreateEmailIdentity(user, 'test@example.com')

    assert.instanceOf(identity, UserIdentity)
    assert.equal(identity.provider, 'email_otp')
    assert.equal(identity.userId, user.id)
    assert.isTrue(identity.emailVerified)
  })

  test('should find existing email identity', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      status: 'active',
    })

    const existingIdentity = await UserIdentity.create({
      userId: user.id,
      provider: 'email_otp',
      providerUserId: user.id,
      email: 'test@example.com',
      emailVerified: false,
    })

    const identity = await AuthService.findOrCreateEmailIdentity(user, 'test@example.com')

    assert.equal(identity.id, existingIdentity.id)
    assert.isTrue(identity.emailVerified) // Should be updated to verified
  })

  test('should update last login time', async ({ assert }) => {
    const user = await User.create({
      email: 'test@example.com',
      status: 'active',
      lastLoginAt: null,
    })

    await AuthService.updateLastLogin(user)

    await user.refresh()
    assert.isNotNull(user.lastLoginAt)
  })

  test('should complete magic link auth flow', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { user, identity } = await AuthService.completeMagicLinkAuth(
      'test@example.com',
      await ctx
    )

    assert.instanceOf(user, User)
    assert.equal(user.email, 'test@example.com')
    assert.isNotNull(user.emailVerifiedAt)
    assert.isNotNull(user.lastLoginAt)

    assert.instanceOf(identity, UserIdentity)
    assert.equal(identity.provider, 'email_otp')
    assert.equal(identity.userId, user.id)
  })
})
