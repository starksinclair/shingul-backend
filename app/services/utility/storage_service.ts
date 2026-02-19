import fs from 'node:fs'
import path from 'node:path'
import env from '#start/env'
import { Readable } from 'node:stream'

export type StorageProvider = 'local' | 's3'

export default class StorageService {
  private provider: StorageProvider

  constructor(provider?: StorageProvider) {
    this.provider = provider ?? (env.get('STORAGE_PROVIDER', 'local') as StorageProvider)
  }

  async put(buffer: Buffer, key: string): Promise<void> {
    if (this.provider === 'local') {
      await this.putLocal(buffer, key)
      return
    }

    // Placeholder for S3
    throw new Error('S3 provider not implemented yet')
  }

  getStream(key: string): Readable {
    if (this.provider === 'local') {
      return fs.createReadStream(this.localPath(key))
    }

    throw new Error('S3 provider not implemented yet')
  }

  async delete(key: string): Promise<void> {
    if (this.provider === 'local') {
      await fs.promises.unlink(this.localPath(key))
      return
    }

    throw new Error('S3 provider not implemented yet')
  }

  private async putLocal(buffer: Buffer, key: string) {
    const fullPath = this.localPath(key)
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.promises.writeFile(fullPath, buffer)
  }

  private localPath(key: string): string {
    return path.join(process.cwd(), 'storage/uploads', key)
  }
}
