import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @EventPattern('transaction.requested')
  async handleTransactionRequested(@Payload() message: unknown): Promise<void> {
    await this.notifications.notifyTransactionRequested(message);
  }

  @EventPattern('transaction.confirmed')
  async handleTransactionConfirmed(@Payload() message: unknown): Promise<void> {
    await this.notifications.notifyTransactionConfirmed(message);
  }
}
