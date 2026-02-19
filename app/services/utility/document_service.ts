import fs from 'node:fs/promises'
import path from 'node:path'
import StudyDocument from '#models/study_document'
import DocumentChunk from '#models/document_chunk'
import app from '@adonisjs/core/services/app'
import { DocumentParser, ParsedChunk } from '#services/interfaces/document_parser'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { sanitizeText } from '../../utils/text_sanitizer.js'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

type ParserRegistry = Record<string, DocumentParser>
/**
 * Default document service implementation
 * Handles PDF and image parsing
 * Can be extended to support more formats
 */
export class DocumentServiceProvider {
  constructor(private parsers: ParserRegistry) {}
  /**
   * Parse a document and extract text content
   * @param document - The document to parse (import from #models/document)
   * @returns Extracted chunks with text and metadata
   */
  async parseDocument(document: { storageKey: string; type: string }): Promise<ParsedChunk[]> {
    const parser = this.parsers[document.type]

    if (!parser) {
      throw new Error(`No parser registered for document type: ${document.type}`)
    }
    const absolutePath = app.makePath('storage', document.storageKey)
    return parser.parseDocument(absolutePath)
  }

  /**
   * Upload a document to storage
   * @param document - The document to upload (import from #models/document)
   * @param file - The file buffer or stream
   * @returns Storage key/path
   */
  async uploadDocument(document: any, file: Buffer | NodeJS.ReadableStream): Promise<string> {
    const studyDocument = document as StudyDocument
    // For now, we'll use local file system storage
    // In production, this should upload to S3, GCS, etc.
    const storageDir = 'storage/documents'
    await fs.mkdir(storageDir, { recursive: true })

    const fileName = `${studyDocument.id}-${studyDocument.fileName}`
    const filePath = path.join(storageDir, fileName)

    if (Buffer.isBuffer(file)) {
      await fs.writeFile(filePath, file)
    } else {
      const chunks: Buffer[] = []
      for await (const chunk of file) {
        chunks.push(Buffer.from(chunk as string))
      }
      await fs.writeFile(filePath, Buffer.concat(chunks))
    }

    // Update document with storage key
    studyDocument.storageKey = filePath
    await studyDocument.save()

    return filePath
  }

  /**
   * Process and store an uploaded document file
   * Handles file upload, parsing, chunking, and metadata extraction
   * @param file - The uploaded file
   * @param studySetId - The study set ID to associate the document with
   * @param uploaderId - The user ID who uploaded the document
   * @param storageKey - The storage key/path for the file
   * @param storageProvider - The storage provider (e.g., 'local', 's3')
   * @param trx - Optional database transaction client
   * @returns The created StudyDocument instance
   */
  async processAndStoreDocument(
    file: MultipartFile,
    studySetId: string,
    uploaderId: number,
    storageKey: string,
    storageProvider: string,
    trx?: TransactionClientContract
  ): Promise<StudyDocument> {
    // Move file to disk
    await file.moveToDisk(storageKey)

    // Create document record
    const document = await StudyDocument.create(
      {
        studySetId,
        uploaderId,
        type: 'pdf',
        fileName: file.clientName || '',
        storageProvider,
        storageKey,
        sizeBytes: file.size || 0,
        mimeType: file.subtype || file.type || '',
        processingStatus: 'uploaded',
        url: file.meta?.url || '',
      },
      trx ? { client: trx } : {}
    )

    // Parse document to extract chunks
    const extractedChunks = await this.parseDocument(document)

    // Create document chunks
    const rows = extractedChunks.map((chunk, i) => ({
      studyDocumentId: document.id,
      studySetId,
      chunkIndex: i,
      text: sanitizeText(chunk.text || ''),
      pageStart: chunk.metadata?.page ?? null,
      pageEnd: chunk.metadata?.page ?? null,
      metadata: chunk.metadata ?? null,
    }))

    await DocumentChunk.createMany(rows, trx ? { client: trx } : {})

    // Calculate and update document metadata
    document.wordCount = rows.reduce(
      (acc, row) => acc + row.text.split(/\s+/).filter((word: string) => word.length > 0).length,
      0
    )
    document.pageCount = extractedChunks[extractedChunks.length - 1]?.metadata?.page ?? 0
    document.processingStatus = 'extracted'

    // Save document with transaction if provided
    if (trx) {
      await document.useTransaction(trx).save()
    } else {
      await document.save()
    }

    return document
  }
}
