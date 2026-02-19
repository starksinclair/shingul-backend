/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { throttle } from './limiter.js'
import { middleware } from './kernel.js'
import transmit from '@adonisjs/transmit/services/main'
const FlashcardDecksController = () => import('../app/controllers/flashcard_decks_controller.js')
const AuthController = () => import('#controllers/auth_controller')
const DocumentsController = () => import('#controllers/documents_controller')
const StudySetsController = () => import('#controllers/study_sets_controller')
const QuizzesController = () => import('#controllers/quizzes_controller')
const QuizAttemptsController = () => import('#controllers/quiz_attempts_controller')
const GamesController = () => import('#controllers/games_controller')
router.get('/', async () => {
  return {
    hello: 'world',
  }
})

// Magic link authentication routes
router
  .group(() => {
    router
      .group(() => {
        router.post('email/start', [AuthController, 'start'])
        router.get('email/callback', [AuthController, 'callback'])
        router
          .group(() => {
            router.get('me', [AuthController, 'me'])
            router.post('logout', [AuthController, 'logout'])
          })
          .use([middleware.auth({ guards: ['web'] })])
      })
      .prefix('/auth')
  })
  .prefix('/api')
  .use(throttle)

// Study sets routes
router
  .group(() => {
    router.resource('study-sets', StudySetsController)
    router.resource('documents', DocumentsController)
    router.resource('flashcard-decks', FlashcardDecksController)
    router.resource('quizzes', QuizzesController)
    router.resource('quiz-attempts', QuizAttemptsController)
    router.resource('games', GamesController)
    router.post('games/join', [GamesController, 'join'])
    router.put('games/:id/start', [GamesController, 'start'])
    router.get('games/:id/players', [GamesController, 'players'])
    router.get('games/:id/game-and-questions', [GamesController, 'getGameAndQuestion'])
    router.post('games/game-response', [GamesController, 'gameResponse'])
    router.put('games/:id/kickout', [GamesController, 'kickout'])
  })
  .prefix('/api')
  .use([middleware.ensureUser()])

transmit.registerRoutes()
