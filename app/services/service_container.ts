import { EmailServiceProvider } from './providers/email_service_provider.js'
import { RateLimitServiceProvider } from './providers/rate_limit_service_provider.js'
import { DocumentServiceProvider } from './utility/document_service.js'
import StorageService from './utility/storage_service.js'
import { DocumentParser } from '#services/interfaces/document_parser'
import { PdfjsDocumentParser } from '#services/providers/parsers/pdfjs_document_parser_provider'
import { AuthService } from '#services/utility/auth_service'
import { FlashcardDeckServiceProvider } from '#services/utility/flashcard_deck_service'
// import { OpenAILLMProvider } from './providers/openai_llm_provider.js'
import { GeminiLLMProvider } from './providers/gemini_llm_provider.js'
import { QuizService } from './utility/quiz_service.js'
import { GameService } from './utility/game_service.js'
import { TransmitService } from './utility/transmit_service.js'

const parsers: Record<string, DocumentParser> = {
  pdf: new PdfjsDocumentParser({ chunkOverlap: 0, chunkSize: 5000 }),
}

// Initialize LLM service (can be swapped for other providers)
// const llmService = new OpenAILLMProvider()
const llmService = new GeminiLLMProvider()
const transmitService = new TransmitService()

/**
 * Service container for dependency injection
 * Centralizes service instantiation and allows easy swapping of implementations
 */
export const serviceContainer = {
  emailService: new EmailServiceProvider(),
  rateLimitService: new RateLimitServiceProvider(),
  documentService: new DocumentServiceProvider(parsers),
  storageService: new StorageService(),
  authService: new AuthService(),
  flashcardDeckService: new FlashcardDeckServiceProvider(llmService),
  quizService: new QuizService(llmService),
  gameService: new GameService(transmitService),
}
