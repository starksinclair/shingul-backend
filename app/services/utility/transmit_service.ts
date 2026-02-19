import transmit from '@adonisjs/transmit/services/main'

export class TransmitService {
  public async broadcast(channel: string, data: any): Promise<void> {
    transmit.broadcast(channel, data)
  }
}
