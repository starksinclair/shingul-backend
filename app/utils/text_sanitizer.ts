/**
 * Utility functions for sanitizing text before database storage
 */

/**
 * Sanitizes text for PostgreSQL storage by removing invalid characters
 * and normalizing the text
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return (
    text
      // Remove null bytes (PostgreSQL doesn't allow \0 in text)
      .replace(/\0/g, '')
      // Normalize line endings to \n
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive whitespace (but keep single spaces and newlines)
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim()
  )
}
