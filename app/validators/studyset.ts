import vine from '@vinejs/vine'

export const studySetValidator = vine.compile(
  vine.object({
    type: vine.enum(['text', 'image', 'pdf', 'mixed', 'audio']).optional(),
    description: vine.string().optional(),
    title: vine.string(),
    files: vine.array(vine.file({ extnames: ['pdf'], size: '25mb' })).optional(),
  })
)
