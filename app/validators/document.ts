import vine from '@vinejs/vine'

export const documentValidator = vine.compile(
  vine.object({
    type: vine.enum(['text', 'image', 'pdf', 'mixed', 'audio']).optional(),
    studySetId: vine.string().exists({ table: 'study_sets', column: 'id' }),
    files: vine.array(vine.file({ extnames: ['pdf'], size: '25mb' }).optional()),
  })
)
