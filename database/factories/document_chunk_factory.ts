import factory from '@adonisjs/lucid/factories'
import DocumentChunk from '#models/document_chunk'

export const DocumentChunkFactory = factory
  .define(DocumentChunk, async ({ faker }) => {
    return {
      studyDocumentId: 0,
      studySetId: '',
      chunkIndex: faker.number.int({ min: 0, max: 100 }),
      pageStart: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 100 }) : null,
      pageEnd: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 100 }) : null,
      text: faker.lorem.paragraphs(2),
    }
  })
  .build()
