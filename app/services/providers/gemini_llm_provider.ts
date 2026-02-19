import type {
  LLMServiceInterface,
  LLMGenerateRequest,
} from '../interfaces/llm_service_interface.js'
import env from '#start/env'
import { GenerateContentConfig, GoogleGenAI } from '@google/genai'

export class GeminiLLMProvider implements LLMServiceInterface {
  private readonly apiKey: string
  private readonly defaultModel: string
  private ai: GoogleGenAI | null = null

  constructor() {
    this.apiKey = env.get('GEMINI_API_KEY') || ''
    this.defaultModel = env.get('GEMINI_MODEL') || 'gemini-3-flash-preview'
  }

  private async initializeClient() {
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey })
    }

    return this.ai
  }

  async generate(request: LLMGenerateRequest): Promise<any> {
    // if (!this.apiKey || process.env.NODE_ENV === 'development') {
    //   console.log('🤖 LLM Service: Using mock generation (set GEMINI_API_KEY for real generation)')
    //   return this.generateMockResponse(request)
    // }

    try {
      await this.initializeClient()

      const combinedPrompt = request.systemMessage
        ? `${request.systemMessage}\n\n${request.userMessage}`
        : request.userMessage

      const config: GenerateContentConfig = {
        temperature: request.temperature ?? 0.7,
        responseMimeType:
          request.responseFormat?.type === 'json_object' ? 'application/json' : undefined,
        maxOutputTokens: request.maxTokens,
      }

      const response =
        (await this.ai?.models.generateContent({
          model: request.model || this.defaultModel,
          contents: combinedPrompt,
          config,
        })) ?? undefined

      const content = response?.text

      // Parse JSON if response format is json_object
      if (request.responseFormat?.type === 'json_object' || !request.responseFormat) {
        if (!content) {
          throw new Error('Empty response from Gemini API')
        }
        try {
          return JSON.parse(content)
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError)
          console.error('Raw content:', content)
          throw new Error(
            `Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
          )
        }
      }

      return content
    } catch (error) {
      console.error('Gemini LLM Service error:', error)
      return this.generateMockResponse(request)
    }
  }

  private generateMockResponse(request: LLMGenerateRequest): any {
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

    return {
      result: 'Mock LLM response',
      content: request.userMessage.slice(0, 100),
    }
  }
}
