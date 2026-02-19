/**
 * Build the user message content based on available inputs
 * Handles different scenarios:
 * - Direct text input
 * - Custom prompt with optional PDF text and description
 */
export function buildUserMessage(
  text?: string,
  options?: {
    customPrompt?: string
    pdfText?: string
  }
): string {
  // console.log('options', options)
  const MAX_TEXT_LENGTH = 8000 // Limit to avoid token limits

  // If custom prompt is provided, use it as the primary instruction
  if (options?.customPrompt) {
    let message = options.customPrompt

    // Add PDF text if provided
    if (options.pdfText) {
      const pdfText = options.pdfText.slice(0, MAX_TEXT_LENGTH)
      message = `${message}\n\nText from PDF documents:\n${pdfText}`
    } else if (text) {
      // Fallback to direct text if no PDF text
      const textContent = text.slice(0, MAX_TEXT_LENGTH)
      message = `${message}\n\nText content:\n${textContent}`
    }

    return message
  }

  // Default: use direct text input
  if (text) {
    return `Generate flashcards from this text:\n\n${text.slice(0, MAX_TEXT_LENGTH)}`
  }

  // If only PDF text is provided
  if (options?.pdfText) {
    const pdfText = options.pdfText.slice(0, MAX_TEXT_LENGTH)
    return `Generate flashcards from this PDF text:\n\n${pdfText}`
  }

  throw new Error('Either text, customPrompt, or pdfText must be provided')
  // return ''
}
