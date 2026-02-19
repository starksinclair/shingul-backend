import { buildUserMessage } from '../../utils/utils.js'
import type { LLMServiceInterface } from '../interfaces/llm_service_interface.js'

export class FlashcardDeckServiceProvider {
  constructor(private llmService: LLMServiceInterface) {}

  /**
   * Generate flashcards from text content
   * Supports multiple input modes:
   * 1. Direct text input
   * 2. Custom prompt with optional PDF text and description
   */
  async generateFlashcards(
    text?: string,
    cardCount?: number,
    difficulty?: 'easy' | 'medium' | 'hard',
    options?: {
      customPrompt?: string
      pdfText?: string
    }
  ): Promise<{
    flashcards: Array<{
      question: string
      answer: string
      hint?: string
      tags?: string[]
    }>
    summary?: string
    keyPoints?: string[]
    title?: string
  }> {
    const userContent = buildUserMessage(text, options)
    const systemMessage = `You are an expert at creating educational flashcards. Generate flashcards based on the user's request.
      Return a JSON object with this structure:
      {
        "flashcards": [
          {
            "question": "string",
            "answer": "string",
            "hint": "string (optional)",
            "tags": ["string"] (optional)
          }
        ],
        "summary": "string",
        "keyPoints": ["string"],
        "title": "string"
      }
      Create ${cardCount || 5}-${cardCount || 10} flashcards that cover the most important concepts. The difficulty of the flashcards should be ${difficulty || 'medium'}. If the user provides a custom prompt, follow their instructions while maintaining the flashcard format.`

    try {
      const content = await this.llmService.generate({
        systemMessage,
        userMessage: userContent,
        responseFormat: { type: 'json_object' },
        temperature: 0.7,
      })

      return {
        flashcards: content.flashcards || [],
        summary: content.summary,
        keyPoints: content.keyPoints,
        title: content.title || '',
      }
    } catch (error) {
      console.error('Flashcard generation error:', error)
      // throw error
      // Fallback to mock generation on error
      return this.generateMockFlashcards(text || options?.pdfText || options?.customPrompt || '')
    }
  }

  /**
   * Generate mock flashcards for development/testing
   */
  private generateMockFlashcards(text: string): {
    flashcards: Array<{
      question: string
      answer: string
      hint?: string
      tags?: string[]
    }>
    summary?: string
    title?: string
    keyPoints?: string[]
  } {
    // Simple mock implementation - split text into sentences and create basic flashcards
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20)
    const flashcards = sentences.slice(0, 5).map((sentence, index) => {
      const words = sentence.trim().split(/\s+/)

      return {
        question: `What is mentioned about: ${words.slice(0, 3).join(' ')}?`,
        answer: sentence.trim(),
        hint: words.slice(0, 5).join(' ') + '...',
        tags: ['general', `section-${index + 1}`],
      }
    })

    return {
      flashcards,
      summary: `Summary of ${sentences.length} key points from the document.`,
      keyPoints: sentences.slice(0, 3).map((s) => s.trim().slice(0, 100)),
      title: `Title of the document.`,
    }
  }
}
