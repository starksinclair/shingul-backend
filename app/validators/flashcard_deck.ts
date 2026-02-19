import vine from '@vinejs/vine'

export const flashcardDeckValidator = vine.compile(
  vine.object({
    studySetId: vine.string().exists({ table: 'study_sets', column: 'id' }),
    documentIds: vine
      .array(vine.number().exists({ table: 'study_documents', column: 'id' }))
      .optional(),
    title: vine.string().optional(),
    description: vine.string().optional(),
    text: vine.string().optional(),
    difficulty: vine.enum(['easy', 'medium', 'hard']),
    count: vine.number().optional(),
    visibility: vine.enum(['public', 'private', 'unlisted']).optional(),
  })
)
