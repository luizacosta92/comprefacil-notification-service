# Comprefácil Notification Service

Microsserviço NestJS independente responsável por consumir eventos de transação do RabbitMQ e persistir notificações no PostgreSQL.

## Executar

```bash
npm install
npm run prisma:generate
docker compose -f docker/docker-compose.yml up -d
npm run prisma:migrate
npm run start:dev
```

## Filas

- `notification.transaction.requested`: solicitações de transação recebidas.
- `notification.transaction.confirmed`: confirmações de pagamento.

Routing keys esperadas:

- `transaction.requested`
- `transaction.confirmed`

## Formato mínimo

```json
{
  "eventId": "event-123",
  "transactionId": "tx-123",
  "userId": "user-123",
  "amount": "150.00",
  "currency": "BRL"
}
```

Os campos `payload`, `data`, `user_id`, `transaction_id`, `paidAmount` e `paymentAmount` também são aceitos.