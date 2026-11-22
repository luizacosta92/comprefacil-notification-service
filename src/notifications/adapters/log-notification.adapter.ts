import { Injectable, Logger } from '@nestjs/common';
import { NotificationDeliveryPort } from '../notification-delivery.port';
import { NotificationDelivery } from '../notification.types';

@Injectable()
export class LogNotificationAdapter implements NotificationDeliveryPort {
  private readonly logger = new Logger(LogNotificationAdapter.name);

  async send(notification: NotificationDelivery): Promise<void> {
    this.logger.log({
      channel: notification.channel,
      userId: notification.userId,
      transactionId: notification.transactionId,
      title: notification.title,
      body: notification.body,
    });
  }
}
