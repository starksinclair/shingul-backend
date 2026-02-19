import type { LLMServiceInterface } from '../interfaces/llm_service_interface.js'
import { buildUserMessage } from '../../utils/utils.js'

export class QuizService {
  constructor(private llmService: LLMServiceInterface) {}
  /**
   * Generate a quiz from text content
   * @param text - The text content to generate a quiz from
   * @param quizCount - The number of questions to generate
   * @param difficulty - The difficulty of the quiz
   * @param options - The options for the quiz
   * @returns The quiz
   */
  async generateQuiz(
    text?: string,
    quizCount?: number,
    difficulty?: 'easy' | 'medium' | 'hard',
    options?: {
      customPrompt?: string
      pdfText?: string
    }
  ): Promise<{
    title: string
    description: string
    questions: Array<{
      question: string
      answer: string
      choices: string[]
      position: number
    }>
  }> {
    const userContent = buildUserMessage(text, options)
    const systemMessage = `You are an expert at creating educational quizzes. Generate a quiz based on the user's request.
      Return a JSON object with this structure:
      {
        "title": "string",
        "description": "string",
        "questions": [
          {
            "question": "string",
            "answer": "string",
            "choices": ["string"],
            "position": number
          }
        ]
      }
      Create ${quizCount || 5}-${quizCount || 10} questions that cover the most important concepts. The difficulty of the questions should be ${difficulty || 'medium'}. If the user provides a custom prompt, follow their instructions while maintaining the quiz format.`
    const content = await this.llmService.generate({
      systemMessage,
      userMessage: userContent,
      responseFormat: { type: 'json_object' },
      temperature: 0.7,
    })
    return content
  }
}
