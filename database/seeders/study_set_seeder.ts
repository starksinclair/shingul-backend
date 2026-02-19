import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import { StudySetFactory } from '../factories/study_set_factory.js'
import { StudyDocumentFactory } from '../factories/study_document_factory.js'
import { DocumentChunkFactory } from '../factories/document_chunk_factory.js'
import { FlashcardDeckFactory } from '../factories/flashcard_deck_factory.js'
import { FlashcardFactory } from '../factories/flashcard_factory.js'
import { QuizFactory } from '../factories/quiz_factory.js'
import { QuizQuestionFactory } from '../factories/quiz_question_factory.js'
import { QuizAttemptFactory } from '../factories/quiz_attempt_factory.js'
import { GameSessionFactory } from '../factories/game_session_factory.js'
import { GameParticipantFactory } from '../factories/game_participant_factory.js'
import { GameResponseFactory } from '../factories/game_response_factory.js'

export default class extends BaseSeeder {
  async run() {
    // Get existing users or create some if none exist
    let users = await User.all()
    if (users.length === 0) {
      const { UserFactory } = await import('../factories/user_factory.js')
      users = await UserFactory.apply('active').apply('verified').createMany(5)
    }

    // Create 3-5 study sets per user
    for (const user of users) {
      const studySetCount = Math.floor(Math.random() * 3) + 3 // 3-5 study sets per user

      for (let i = 0; i < studySetCount; i++) {
        const studySet = await StudySetFactory.merge({ ownerId: user.id })
          .apply(Math.random() > 0.5 ? 'ready' : 'draft')
          .apply(Math.random() > 0.3 ? 'private' : 'public')
          .create()

        // Create 1-3 study documents per study set
        const documentCount = Math.floor(Math.random() * 3) + 1
        const documents = []

        for (let j = 0; j < documentCount; j++) {
          const document = await StudyDocumentFactory.merge({
            studySetId: studySet.id,
            uploaderId: user.id,
          })
            .apply(Math.random() > 0.3 ? 'extracted' : 'failed')
            .create()
          documents.push(document)

          // Create document chunks for extracted documents
          if (document.processingStatus === 'extracted') {
            const chunkCount = Math.floor(Math.random() * 5) + 3 // 3-7 chunks per document
            for (let k = 0; k < chunkCount; k++) {
              await DocumentChunkFactory.merge({
                studyDocumentId: document.id,
                studySetId: studySet.id,
                chunkIndex: k,
                pageStart: k * 2 + 1,
                pageEnd: k * 2 + 2,
              }).create()
            }
          }
        }

        // For each document, create flashcard decks and flashcards
        for (const document of documents) {
          // Create 1-2 flashcard decks per document
          const deckCount = Math.floor(Math.random() * 2) + 1

          for (let k = 0; k < deckCount; k++) {
            const deck = await FlashcardDeckFactory.merge({
              studySetId: studySet.id,
              studyDocumentId: document.id,
            })
              .apply(Math.random() > 0.5 ? 'ai_created' : 'user_created')
              .create()

            // Create 5-15 flashcards per deck
            const cardCount = Math.floor(Math.random() * 11) + 5
            for (let l = 0; l < cardCount; l++) {
              const cardFactory = FlashcardFactory.merge({
                flashcardDeckId: deck.id,
                position: l + 1,
              })
              if (Math.random() > 0.7) {
                await cardFactory.apply('reviewed').create()
              } else {
                await cardFactory.create()
              }
            }

            // Update deck card count
            deck.cardCount = cardCount
            await deck.save()
          }
        }

        // Create 1-2 quizzes per study set
        const quizCount = Math.floor(Math.random() * 2) + 1

        for (let m = 0; m < quizCount; m++) {
          const quiz = await QuizFactory.merge({
            studySetId: studySet.id,
          })
            .apply(Math.random() > 0.5 ? 'practice' : 'live')
            .create()

          // Create 5-10 questions per quiz
          const questionCount = Math.floor(Math.random() * 6) + 5
          const questions = []

          for (let n = 0; n < questionCount; n++) {
            const questionFactory = QuizQuestionFactory.merge({
              quizId: quiz.id,
              position: n + 1,
            })
            const question =
              Math.random() > 0.5
                ? await questionFactory.apply('multiple_choice').create()
                : await questionFactory.create()
            questions.push(question)
          }

          // Update quiz question count
          quiz.questionCount = questionCount
          quiz.totalPoints = questionCount * 10
          await quiz.save()

          // Create 2-5 quiz attempts per quiz (from random users)
          const attemptCount = Math.floor(Math.random() * 4) + 2
          for (let o = 0; o < attemptCount; o++) {
            const randomUser = users[Math.floor(Math.random() * users.length)]
            await QuizAttemptFactory.merge({
              quizId: quiz.id,
              userId: randomUser.id,
            })
              .apply(Math.random() > 0.3 ? 'completed' : 'in_progress')
              .create()
          }

          // Create 1-2 game sessions per quiz (from random users)
          if (Math.random() > 0.5) {
            const hostUser = users[Math.floor(Math.random() * users.length)]
            const randomDocument = documents[Math.floor(Math.random() * documents.length)]

            const gameSession = await GameSessionFactory.merge({
              studySetId: studySet.id,
              hostUserId: hostUser.id,
              studyDocumentId: randomDocument.id as unknown as string,
              quizId: quiz.id,
            })
              .apply(Math.random() > 0.5 ? 'waiting' : 'active')
              .create()

            // Create 2-5 participants per game session
            const participantCount = Math.min(Math.floor(Math.random() * 4) + 2, users.length)
            const participants = []
            const usedUserIds = new Set<number>()

            for (let p = 0; p < participantCount; p++) {
              // Find a user that hasn't joined this session yet
              let participantUser
              let attempts = 0
              do {
                participantUser = users[Math.floor(Math.random() * users.length)]
                attempts++
                // Prevent infinite loop if we run out of users
                if (attempts > users.length * 2) {
                  break
                }
              } while (usedUserIds.has(participantUser.id))

              if (usedUserIds.has(participantUser.id)) {
                continue // Skip if we couldn't find a unique user
              }

              usedUserIds.add(participantUser.id)

              const participant = await GameParticipantFactory.merge({
                gameSessionId: gameSession.id,
                userId: participantUser.id,
              })
                .apply('left')
                .create()
              participants.push(participant)
            }

            // Update game session player count
            gameSession.playerCount = participantCount
            gameSession.totalQuestions = questionCount
            await gameSession.save()

            // Create responses for active/completed game sessions
            if (gameSession.status === 'active' || gameSession.status === 'completed') {
              // Create responses for some questions from some participants
              const responseCount =
                Math.floor(Math.random() * (questionCount * participantCount * 0.7)) + 1

              for (let q = 0; q < responseCount; q++) {
                const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
                const randomParticipant =
                  participants[Math.floor(Math.random() * participants.length)]

                await GameResponseFactory.merge({
                  gameSessionId: gameSession.id,
                  questionId: randomQuestion.id,
                  gameParticipantId: randomParticipant.id,
                })
                  .apply(Math.random() > 0.4 ? 'correct' : 'incorrect')
                  .create()
              }
            }
          }
        }
      }
    }
  }
}
