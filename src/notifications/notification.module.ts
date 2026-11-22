import { Module } from '@nestjs/common';
import { LogNotificationAdapter } from './adapters/log-notification.adapter';
import { NOTIFICATION_DELIVERY } from './notification-delivery.port';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    {
      provide: NOTIFICATION_DELIVERY,
      useClass: LogNotificationAdapter,
    },
  ],
})
export class NotificationModule {}
