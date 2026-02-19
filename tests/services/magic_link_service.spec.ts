import { test } from '@japa/runner'
import { MagicLinkService } from '#services/utility/magic_link_service'
import LoginLink from '#models/login_link'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('MagicLinkService', (group) => {
  group.each.setup(async () => {
    await LoginLink.query().delete()
  })

  test('should create a magic link with token', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { token, loginLink } = await MagicLinkService.createMagicLink(
      'test@example.com',
      await ctx,
      10
    )

    assert.isString(token)
    assert.lengthOf(token, 64)
    assert.instanceOf(loginLink, LoginLink)
    assert.equal(loginLink.email, 'test@example.com')
    assert.isFalse(loginLink.isExpired())
    assert.isFalse(loginLink.isConsumed())
  })

  test('should hash token before storing', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { token, loginLink } = await MagicLinkService.createMagicLink(
      'test@example.com',
      await ctx,
      10
    )

    // Token should not match the hash
    assert.notEqual(token, loginLink.tokenHash)
    // Hash should be 64 characters (SHA256)
    assert.lengthOf(loginLink.tokenHash, 64)
  })

  test('should set expiration correctly', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { loginLink } = await MagicLinkService.createMagicLink('test@example.com', await ctx, 10)

    const expectedExpiry = DateTime.now().plus({ minutes: 10 })
    const diff = loginLink.expiresAt.diff(expectedExpiry, 'minutes').minutes

    // Should be within 1 minute of expected expiry
    assert.isBelow(Math.abs(diff), 1)
  })

  test('should find login link by token', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { token, loginLink: createdLink } = await MagicLinkService.createMagicLink(
      'test@example.com',
      await ctx,
      10
    )

    const foundLink = await MagicLinkService.findLoginLinkByToken(token)

    assert.isNotNull(foundLink)
    assert.equal(foundLink!.id, createdLink.id)
    assert.equal(foundLink!.email, createdLink.email)
  })

  test('should not find consumed login link', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { token } = await MagicLinkService.createMagicLink('test@example.com', await ctx, 10)

    const loginLink = await MagicLinkService.findLoginLinkByToken(token)
    await loginLink!.markAsConsumed()

    const foundLink = await MagicLinkService.findLoginLinkByToken(token)
    assert.isNull(foundLink)
  })

  test('should verify valid token', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { token } = await MagicLinkService.createMagicLink('test@example.com', await ctx, 10)

    const { valid, loginLink } = await MagicLinkService.verifyAndConsumeToken(token)

    assert.isTrue(valid)
    assert.isNotNull(loginLink)
    assert.isTrue(loginLink!.isConsumed())
  })

  test('should reject expired token', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { token, loginLink } = await MagicLinkService.createMagicLink(
      'test@example.com',
      await ctx,
      10
    )

    // Manually expire the token
    loginLink.expiresAt = DateTime.now().minus({ minutes: 1 })
    await loginLink.save()

    const { valid, reason } = await MagicLinkService.verifyAndConsumeToken(token)

    assert.isFalse(valid)
    assert.equal(reason, 'Token expired')
  })

  test('should reject invalid token', async ({ assert }) => {
    const invalidToken = 'invalid-token-123'

    const { valid, reason } = await MagicLinkService.verifyAndConsumeToken(invalidToken)

    assert.isFalse(valid)
    assert.equal(reason, 'Invalid token')
  })

  test('should reject token after max attempts', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { token, loginLink } = await MagicLinkService.createMagicLink(
      'test@example.com',
      await ctx,
      10
    )

    // Set attempts to max
    loginLink.attempts = 5
    await loginLink.save()

    const { valid, reason } = await MagicLinkService.verifyAndConsumeToken(token)

    assert.isFalse(valid)
    assert.equal(reason, 'Too many attempts')
  })

  test('should increment attempts on verification', async ({ assert }) => {
    const ctx = testUtils.createHttpContext()
    const { token, loginLink } = await MagicLinkService.createMagicLink(
      'test@example.com',
      await ctx,
      10
    )

    assert.equal(loginLink.attempts, 0)

    // Try to verify (will fail because we'll expire it first)
    loginLink.expiresAt = DateTime.now().minus({ minutes: 1 })
    await loginLink.save()

    await MagicLinkService.verifyAndConsumeToken(token)

    // Reload to check attempts
    await loginLink.refresh()
    assert.isAbove(loginLink.attempts, 0)
  })
})
