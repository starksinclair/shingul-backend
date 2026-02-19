import fs from 'node:fs/promises'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { DocumentParser, ParsedChunk } from '#services/interfaces/document_parser'

type ChunkOptions = {
  chunkSize?: number
  chunkOverlap?: number
  minChunkChars?: number
}

export class PdfjsDocumentParser implements DocumentParser {
  private readonly chunkSize: number
  private readonly chunkOverlap: number
  private readonly minChunkChars: number

  constructor(options: ChunkOptions = {}) {
    this.chunkSize = options.chunkSize ?? 750
    this.chunkOverlap = options.chunkOverlap ?? 0
    this.minChunkChars = options.minChunkChars ?? 30
  }

  async parseDocument(filePath: string): Promise<ParsedChunk[]> {
    const data = new Uint8Array(await fs.readFile(filePath))
    const pdfDoc = await pdfjsLib.getDocument({ data }).promise

    const chunks: ParsedChunk[] = []
    let globalChunkIndex = 0

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum)
      const content = await page.getTextContent()

      const pageText = content.items
        .map((it: any) => (typeof it.str === 'string' ? it.str : ''))
        .join(' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim()

      if (!pageText) continue

      const parts = this.chunkText(pageText, this.chunkSize, this.chunkOverlap)

      for (const part of parts) {
        if (part.length < this.minChunkChars) continue

        chunks.push({
          text: part,
          metadata: {
            page: pageNum,
            chunkIndex: globalChunkIndex,
            source: 'pdfjs-dist',
          },
        })

        globalChunkIndex++
      }
    }

    return chunks
  }

  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const clean = text
      .replace(/\r/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim()
    if (!clean) return []

    const out: string[] = []
    let start = 0

    while (start < clean.length) {
      let end = Math.min(start + chunkSize, clean.length)

      // Prefer splitting on whitespace near the end to avoid cutting words
      if (end < clean.length) {
        const lastSpace = clean.lastIndexOf(' ', end)
        if (lastSpace > start + Math.floor(chunkSize * 0.6)) end = lastSpace
      }

      const slice = clean.slice(start, end).trim()
      if (slice) out.push(slice)

      start = overlap > 0 ? Math.max(end - overlap, 0) : end
    }

    return out
  }
}
