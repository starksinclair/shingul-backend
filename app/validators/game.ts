import vine from '@vinejs/vine'
import GameSession from '../models/game_session.js'
import GameResponse from '../models/game_response.js'

export const createGameSessionValidator = vine.compile(
  vine.object({
    studySetId: vine.string().exists({ table: 'study_sets', column: 'id' }),
    quizId: vine.string().exists({ table: 'quizzes', column: 'id' }),
    title: vine.string().optional(),
    maxPlayers: vine.number().optional(),
    pointsPerQuestion: vine.number().optional(),
    timePerQuestion: vine.number().optional(),
    playerViewMode: vine.enum(['full', 'options', 'answers']).optional(),
  })
)

const validateGame = vine.createRule(async (_value, _, field) => {
  const { gameSessionId } = field.data as { gameSessionId: number }
  const gameSession = await GameSession.find(gameSessionId)
  if (gameSession && gameSession.status === 'ended') {
    return field.report(
      'Game session has ended',
      'Cannot join a game session that has ended',
      field
    )
  }
})

const validateGameStarted = vine.createRule(async (_value, _, field) => {
  // console.log('Validate game started', field.data)
  const { code } = field.data as { code: string }
  const gameSession = await GameSession.query().where('code', code).preload('participants').first()
  if (!gameSession) {
    return field.report('Game session not found', 'Game session not found', field)
  }
  if (gameSession.status === 'ended' || gameSession.status === 'cancelled') {
    return field.report('Game session has ended', 'Game session has ended', field)
  }
  if (gameSession.activePlayerCount >= gameSession.maxPlayers) {
    return field.report('Game session is full', 'Game session is full', field)
  }
  return true
})
export const joinGameSessionValidator = vine.compile(
  vine.object({
    code: vine
      .string()
      .exists({ table: 'game_sessions', column: 'code' })
      .use(validateGameStarted()),
    nickname: vine.string().optional(),
    avatarColor: vine.string().optional(),
  })
)

export const startGameSessionValidator = vine.compile(
  vine
    .object({
      gameSessionId: vine.number().exists({ table: 'game_sessions', column: 'id' }),
      timePerQuestionSeconds: vine.number().optional(),
      pointsPerQuestion: vine.number().optional(),
      playerViewMode: vine.enum(['full', 'options', 'answers']).optional(),
    })
    .use(validateGame())
)

const EnsureUniqueResponse = vine.createRule(async (_value, _, field) => {
  const { gameSessionId, questionId } = field.data as { gameSessionId: number; questionId: number }
  const gameResponse = await GameResponse.query()
    .where('game_session_id', gameSessionId)
    .andWhere('question_id', questionId)
    .first()
  if (gameResponse) {
    return field.report(
      'You have already answered this question',
      'You have already answered this question',
      field
    )
  }
})
export const gameResponseValidator = vine.compile(
  vine.object({
    gameSessionId: vine.number().exists({ table: 'game_sessions', column: 'id' }),
    questionId: vine.number().exists({ table: 'quiz_questions', column: 'id' }),
    // .use(EnsureUniqueResponse()),
    choice: vine.string().optional(),
    timeUsedSeconds: vine.number().optional(),
  })
)

export const kickoutGameSessionValidator = vine.compile(
  vine.object({
    // hostUserId: vine.number().exists({ table: 'users', column: 'id' }),
    gameSessionId: vine.number().exists({ table: 'game_sessions', column: 'id' }),
    participantId: vine.number().exists({ table: 'game_participants', column: 'id' }),
  })
)

// const validateGameParticipant = vine.createRule(async (_value, _, field) => {
//   const { gameSessionId, participantId, hostUserId } = field.data as {
//     gameSessionId: number
//     participantId: number
//     hostUserId: number
//   }
//   const gameSession = await GameSession.query()
//     .where('id', gameSessionId)
//     .andWhere('host_user_id', hostUserId)
//     .first()
//   if (!gameSession) {
//     return field.report('Failed to kick out participant', 'Failed to kick out participant', field)
//   }

//   const gameParticipant = await gameSession.getParticipant(participantId)
//   if (!gameParticipant || gameParticipant.status !== 'active') {
//     return field.report('Failed to kick out participant', 'Failed to kick out participant', field)
//   }
// })
