export interface TransactionRequestedEvent {
  eventId: string;
  transactionId: string;
  userId: string;
  amount?: string;
  currency: string;
}

export interface TransactionConfirmedEvent {
  eventId: string;
  transactionId: string;
  userId: string;
  amount?: string;
  currency: string;
}

export interface NotificationDelivery {
  title: string;
  body: string;
  userId: string;
  channel: string;
  transactionId: string;
}
