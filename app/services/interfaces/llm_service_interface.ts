/**
 * Interface for LLM (Large Language Model) services
 * Allows swapping between different LLM providers (OpenAI, Anthropic, etc.)
 */
export interface LLMServiceInterface {
  /**
   * Generate a completion from the LLM
   * @param request - The request parameters for the LLM
   * @returns The parsed JSON response from the LLM
   */
  generate(request: LLMGenerateRequest): Promise<any>
}

/**
 * Request parameters for LLM generation
 */
export interface LLMGenerateRequest {
  /**
   * System message/instruction for the LLM
   */
  systemMessage: string

  /**
   * User message/content
   */
  userMessage: string

  /**
   * Response format configuration
   * For OpenAI: { type: 'json_object' } or { type: 'text' }
   */
  responseFormat?: {
    type: 'json_object' | 'text'
  }

  /**
   * Model to use (optional, provider may have default)
   */
  model?: string

  /**
   * Temperature for generation (0-2, default 0.7)
   */
  temperature?: number

  /**
   * Maximum tokens in response (optional)
   */
  maxTokens?: number
}
