import { test } from '@japa/runner'
import { TokenService } from '#services/token_service'

test.group('TokenService', () => {
  test('should generate a 64-character token', ({ assert }) => {
    const token = TokenService.generateToken()
    assert.lengthOf(token, 64)
  })

  test('should generate unique tokens', ({ assert }) => {
    const token1 = TokenService.generateToken()
    const token2 = TokenService.generateToken()
    assert.notEqual(token1, token2)
  })

  test('should hash token with SHA256', ({ assert }) => {
    const token = TokenService.generateToken()
    const hash = TokenService.hashToken(token)
    assert.lengthOf(hash, 64)
    assert.isString(hash)
  })

  test('should verify token correctly', ({ assert }) => {
    const token = TokenService.generateToken()
    const hash = TokenService.hashToken(token)
    assert.isTrue(TokenService.verifyToken(token, hash))
  })

  test('should reject incorrect token', ({ assert }) => {
    const token1 = TokenService.generateToken()
    const token2 = TokenService.generateToken()
    const hash = TokenService.hashToken(token1)
    assert.isFalse(TokenService.verifyToken(token2, hash))
  })

  test('should produce consistent hashes', ({ assert }) => {
    const token = 'test-token-123'
    const hash1 = TokenService.hashToken(token)
    const hash2 = TokenService.hashToken(token)
    assert.equal(hash1, hash2)
  })
})

