import { createHash, randomBytes } from 'node:crypto'

/**
 * Service for generating and hashing tokens for magic links
 */
export class TokenService {
  /**
   * Generate a random 64-character token
   */
  static generateToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Hash a token using SHA256
   */
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Verify a token against a hash
   */
  static verifyToken(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token)
    return tokenHash === hash
  }
}
