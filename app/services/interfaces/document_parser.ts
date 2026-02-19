export type ParsedChunk = {
  text: string
  metadata: Record<string, any>
}

export interface DocumentParser {
  /**
   * Parse a local file path and return extracted chunks.
   * filePath should be an absolute filesystem path (e.g. /.../storage/study_sets/...pdf)
   */
  parseDocument(filePath: string): Promise<ParsedChunk[]>
}
