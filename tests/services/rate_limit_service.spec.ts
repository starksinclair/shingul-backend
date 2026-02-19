import { test } from '@japa/runner'
import LoginLink from '#models/login_link'
import { DateTime } from 'luxon'
import { serviceContainer } from '#services/service_container'

test.group('RateLimitService', (group) => {
  group.each.setup(async () => {
    // Clean up before each test
    await LoginLink.query().delete()
  })

  test('should not rate limit when no recent requests exist', async ({ assert }) => {
    const isLimited = await serviceContainer.rateLimitService.isRateLimited('test@example.com', 1)
    assert.isFalse(isLimited)
  })

  test('should rate limit when recent request exists', async ({ assert }) => {
    // Create a recent login link
    await LoginLink.create({
      email: 'test@example.com',
      tokenHash: 'test-hash',
      expiresAt: DateTime.now().plus({ minutes: 10 }),
      attempts: 0,
    })

    const isLimited = await serviceContainer.rateLimitService.isRateLimited('test@example.com', 1)
    assert.isTrue(isLimited)
  })

  test('should not rate limit when request is older than limit', async ({ assert }) => {
    // Create an old login link (2 minutes ago)
    const oldTime = DateTime.now().minus({ minutes: 2 })
    await LoginLink.create({
      email: 'test@example.com',
      tokenHash: 'test-hash',
      expiresAt: DateTime.now().plus({ minutes: 10 }),
      attempts: 0,
      createdAt: oldTime,
    })

    const isLimited = await serviceContainer.rateLimitService.isRateLimited('test@example.com', 1)
    assert.isFalse(isLimited)
  })

  test('should return correct time remaining', async ({ assert }) => {
    // Create a recent login link
    await LoginLink.create({
      email: 'test@example.com',
      tokenHash: 'test-hash',
      expiresAt: DateTime.now().plus({ minutes: 10 }),
      attempts: 0,
    })

    const timeRemaining = await serviceContainer.rateLimitService.getTimeRemaining(
      'test@example.com',
      1
    )
    assert.isNumber(timeRemaining)
    assert.isAbove(timeRemaining, 0)
    assert.isBelow(timeRemaining, 60) // Should be less than 60 seconds
  })

  test('should return 0 when not rate limited', async ({ assert }) => {
    const timeRemaining = await serviceContainer.rateLimitService.getTimeRemaining(
      'test@example.com',
      1
    )
    assert.equal(timeRemaining, 0)
  })
})
