import app from '@adonisjs/core/services/app'
import env from '#start/env'
import type { EmailServiceInterface } from '../interfaces/email_service_interface.js'

/**
 * Default email service implementation
 * Uses console logging in development, can be extended for production
 */
export class EmailServiceProvider implements EmailServiceInterface {
  /**
   * Send a magic link email
   */
  async sendMagicLink(email: string, token: string): Promise<void> {
    const apiUrl = env.get('API_URL') || 'http://localhost:3333'
    const magicLink = `${apiUrl}/api/auth/email/callback?token=${token}`

    // In development, log the email instead of sending
    if (app.inDev) {
      console.log('\n📧 Magic Link Email:')
      console.log(`To: ${email}`)
      console.log(`Link: ${magicLink}\n`)
      return
    }

    // TODO: Implement actual email sending using @adonisjs/mail or a service like SendGrid, SES, etc.
    // For now, we'll just log it in development
    console.log('\n📧 Magic Link Email (would be sent in production):')
    console.log(`To: ${email}`)
    console.log(`Link: ${magicLink}\n`)

    // In production, you should implement actual email sending here
    // For now, we'll allow it to proceed but log a warning
    if (app.inProduction) {
      console.warn('⚠️  Email service not fully implemented. Magic link:', magicLink)
    }
  }
}
