/**
 * Interface for email sending services
 * Allows swapping between different email providers (SendGrid, SES, SMTP, etc.)
 */
export interface EmailServiceInterface {
  /**
   * Send a magic link email to the user
   */
  sendMagicLink(email: string, token: string): Promise<void>
}
