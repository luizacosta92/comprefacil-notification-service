# CompreFácil Notification Service

Microsserviço em NestJS responsável pelo consumo assíncrono de eventos de transação, persistência de notificações e envio de avisos ao usuário, integrado de forma desacoplada ao **CompreFácil Payment Service** ([`comprefacil-payment-service`](https://github.com/luizacosta92/comprefacil-payment-service.git)).

Desenvolvido sob princípios de arquitetura distribuída, o serviço escuta eventos de solicitação e confirmação de pagamento via mensageria assíncrona (RabbitMQ), realiza a persistência em banco relacional (Postgres via Prisma) com controle de duplicidade e executa o envio das notificações com tratamento de erros.

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
