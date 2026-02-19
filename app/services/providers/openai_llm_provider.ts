import type {
  LLMServiceInterface,
  LLMGenerateRequest,
} from '../interfaces/llm_service_interface.js'
import env from '#start/env'

/**
 * OpenAI LLM provider implementation
 * Handles communication with OpenAI's API
 */
export class OpenAILLMProvider implements LLMServiceInterface {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly defaultModel: string

  constructor() {
    this.apiKey = env.get('OPENAI_API_KEY') || ''
    this.baseUrl = env.get('OPENAI_BASE_URL') || 'https://api.openai.com/v1'
    this.defaultModel = env.get('OPENAI_MODEL') || 'gpt-4'
  }

  /**
   * Generate a completion from OpenAI
   */
  async generate(request: LLMGenerateRequest): Promise<any> {
    // In development, return mock data if API key is not set
    if (!this.apiKey || process.env.NODE_ENV === 'development') {
      console.log('🤖 LLM Service: Using mock generation (set OPENAI_API_KEY for real generation)')
      return this.generateMockResponse(request)
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model || this.defaultModel,
          messages: [
            {
              role: 'system',
              content: request.systemMessage,
            },
            {
              role: 'user',
              content: request.userMessage,
            },
          ],
          response_format: request.responseFormat || { type: 'json_object' },
          temperature: request.temperature ?? 0.7,
          ...(request.maxTokens && { max_tokens: request.maxTokens }),
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      const data = (await response.json()) as {
        choices: {
          message: {
            content: string
          }
        }[]
      }

      const content = data.choices[0].message.content

      // Parse JSON if response format is json_object
      if (request.responseFormat?.type === 'json_object' || !request.responseFormat) {
        return JSON.parse(content)
      }

      return content
    } catch (error) {
      console.error('OpenAI LLM Service error:', error)
      // Fallback to mock generation on error
      return this.generateMockResponse(request)
    }
  }

  /**
   * Generate a mock response for development/testing
   */
  private generateMockResponse(request: LLMGenerateRequest): any {
    // Try to extract structure from system message
    const systemMessage = request.systemMessage.toLowerCase()

    if (systemMessage.includes('flashcard')) {
      return {
        flashcards: [
          {
            question: 'Mock question 1',
            answer: 'Mock answer 1',
            hint: 'Mock hint 1',
            tags: ['mock'],
          },
          {
            question: 'Mock question 2',
            answer: 'Mock answer 2',
            hint: 'Mock hint 2',
            tags: ['mock'],
          },
        ],
        summary: 'Mock summary',
        keyPoints: ['Mock point 1', 'Mock point 2'],
        title: 'Mock Title',
      }
    }

    if (systemMessage.includes('quiz')) {
      return {
        questions: [
          {
            type: 'multiple_choice',
            question: 'Mock quiz question 1?',
            choices: ['Option A', 'Option B', 'Option C', 'Option D'],
            answer: 'Option A',
            explanation: 'Mock explanation',
          },
        ],
        title: 'Mock Quiz Title',
      }
    }

    // Default mock response
    return {
      result: 'Mock LLM response',
      content: request.userMessage.slice(0, 100),
    }
  }
}
