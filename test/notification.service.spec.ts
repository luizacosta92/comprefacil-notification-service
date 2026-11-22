import { NotificationStatus, NotificationType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../src/notifications/notification.service';
import { NotificationDeliveryPort } from '../src/notifications/notification-delivery.port';

describe('NotificationService', () => {
  const notification = {
    id: 'notification-1',
  };

  const prisma = {
    notification: {
      create: jest.fn().mockResolvedValue(notification),
      update: jest.fn().mockResolvedValue(notification),
    },
  };

  const delivery: jest.Mocked<NotificationDeliveryPort> = {
    send: jest.fn().mockResolvedValue(undefined),
  };

  const config = new ConfigService({ NOTIFICATION_CHANNEL: 'LOG' });
  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService(prisma as never, delivery, config);
  });

  it('persiste e envia a notificação de solicitação', async () => {
    await service.notifyTransactionRequested({
      eventId: 'event-requested-1',
      transactionId: 'transaction-1',
      userId: 'user-1',
      amount: '150.00',
      currency: 'BRL',
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sourceEventId: 'event-requested-1',
        userId: 'user-1',
        transactionId: 'transaction-1',
        type: NotificationType.TRANSACTION_REQUESTED,
        status: NotificationStatus.PENDING,
      }),
    });
    expect(delivery.send).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        transactionId: 'transaction-1',
        title: 'Solicitação de transação recebida',
      }),
    );
  });

  it('persiste e envia a notificação de confirmação', async () => {
    await service.notifyTransactionConfirmed({
      payload: {
        event_id: 'event-confirmed-1',
        payment_id: 'transaction-2',
        customerId: 'user-2',
        paymentAmount: '250.00',
        currencyCode: 'BRL',
      },
    });

    expect(delivery.send).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        transactionId: 'transaction-2',
        title: 'Pagamento confirmado',
      }),
    );
  });

  it('rejeita uma mensagem sem destinatário', async () => {
    await expect(
      service.notifyTransactionRequested({
        transactionId: 'transaction-1',
      }),
    ).rejects.toThrow('transactionId e userId');
  });
});
