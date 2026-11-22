import { NotificationDelivery } from './notification.types';

export const NOTIFICATION_DELIVERY = Symbol('NOTIFICATION_DELIVERY');

export interface NotificationDeliveryPort {
  send(notification: NotificationDelivery): Promise<void>;
}
