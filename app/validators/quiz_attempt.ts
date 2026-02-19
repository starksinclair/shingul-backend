import vine from '@vinejs/vine'

export const quizAttemptValidator = vine.compile(
  vine.object({
    quizId: vine.string().exists({ table: 'quizzes', column: 'id' }),
    score: vine.number().optional(),
    total: vine.number().optional(),
    startedAt: vine.string().optional(),
    completedAt: vine.string().optional(),
    mode: vine.enum(['practice', 'live']).optional(),
  })
)

export const updateQuizAttemptValidator = vine.compile(
  vine.object({
    score: vine.number().optional(),
    total: vine.number().optional(),
    completedAt: vine.string().optional(),
  })
)
