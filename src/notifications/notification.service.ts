import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationStatus, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  NOTIFICATION_DELIVERY,
  NotificationDeliveryPort,
} from './notification-delivery.port';

type EventRecord = Record<string, unknown>;

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_DELIVERY)
    private readonly delivery: NotificationDeliveryPort,
    private readonly config: ConfigService,
  ) {}

  async notifyTransactionRequested(message: unknown): Promise<void> {
    const event = this.normalizeEvent(message, 'TRANSACTION_REQUESTED');
    const amount = event.amount
      ? ` O valor solicitado foi ${event.amount} ${event.currency}.`
      : '';

    await this.createAndDeliver({
      sourceEventId: event.eventId,
      userId: event.userId,
      transactionId: event.transactionId,
      type: NotificationType.TRANSACTION_REQUESTED,
      title: 'Solicitação de transação recebida',
      body: `Recebemos sua solicitação de transação ${event.transactionId}.${amount}`,
      channel: this.config.get<string>('NOTIFICATION_CHANNEL', 'LOG'),
    });
  }

  async notifyTransactionConfirmed(message: unknown): Promise<void> {
    const event = this.normalizeEvent(message, 'TRANSACTION_CONFIRMED');
    const amount = event.amount
      ? ` O pagamento de ${event.amount} ${event.currency} foi confirmado.`
      : ' O pagamento foi confirmado.';

    await this.createAndDeliver({
      sourceEventId: event.eventId,
      userId: event.userId,
      transactionId: event.transactionId,
      type: NotificationType.TRANSACTION_CONFIRMED,
      title: 'Pagamento confirmado',
      body: `A transação ${event.transactionId} foi confirmada.${amount}`,
      channel: this.config.get<string>('NOTIFICATION_CHANNEL', 'LOG'),
    });
  }

  private async createAndDeliver(input: {
    sourceEventId: string;
    userId: string;
    transactionId: string;
    type: NotificationType;
    title: string;
    body: string;
    channel: string;
  }): Promise<void> {
    let notification;

    try {
      notification = await this.prisma.notification.create({
        data: { ...input, status: NotificationStatus.PENDING },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.log(
          `Evento duplicado ignorado: ${input.sourceEventId}`,
        );
        return;
      }
      throw error;
    }

    try {
      await this.delivery.send({
        title: input.title,
        body: input.body,
        userId: input.userId,
        channel: input.channel,
        transactionId: input.transactionId,
      });

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });
    } catch (error) {
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });
      throw error;
    }
  }

private normalizeEvent(
    message: unknown,
    eventType: 'TRANSACTION_REQUESTED' | 'TRANSACTION_CONFIRMED',
  ): {
    eventId: string;
    transactionId: string;
    userId: string;
    amount?: string;
    currency: string;
  } {
    const record = this.asRecord(message);
    const nestedPayload = this.asRecord(record.payload);
    const nestedData = this.asRecord(record.data);
    const nested = { ...nestedData, ...nestedPayload, ...record };
    const nestedUser = this.asRecord(nested.user);

    const transactionId =
      this.firstString(
        nested.transactionId,
        nested.transaction_id,
        nested.paymentId,
        nested.payment_id,
      ) ?? `tx-${eventType.toLowerCase()}-${Date.now()}`;

    const userId =
      this.firstString(
        nested.userId,
        nested.user_id,
        nested.recipientId,
        nested.customerId,
        nested.payer,
        nestedUser.id,
      ) ?? 'customer-test';

    const eventId =
      this.firstString(
        nested.eventId,
        nested.event_id,
        nested.messageId,
        nested.correlationId,
      ) ?? `${eventType}:${transactionId}`;

    const amountValue = this.firstValue(
      nested.amount,
      nested.paidAmount,
      nested.paymentAmount,
      nested.value,
      nested.total,
    );
    const amount =
      amountValue === undefined || amountValue === null
        ? undefined
        : String(amountValue);
    const currency =
      this.firstString(nested.currency, nested.currencyCode) ?? 'BRL';

    return { eventId, transactionId, userId, amount, currency };
  }

  private asRecord(value: unknown): EventRecord {
    return value !== null && typeof value === 'object'
      ? (value as EventRecord)
      : {};
  }

  private firstString(...values: unknown[]): string | undefined {
    const value = values.find(
      (item) => typeof item === 'string' && item.trim().length > 0,
    );
    return typeof value === 'string' ? value : undefined;
  }

  private firstValue(...values: unknown[]): unknown {
    return values.find((value) => value !== undefined && value !== null);
  }
}
