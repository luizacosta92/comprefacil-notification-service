import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const uri = config.getOrThrow<string>('RABBITMQ_URI');
  const prefetchCount = config.get<number>('RABBITMQ_PREFETCH_COUNT', 10);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [uri],
      queue: config.getOrThrow<string>('RABBITMQ_REQUEST_QUEUE'),
      prefetchCount,
      noAck: false,
      persistent: true,
      exchange: 'amq.topic',
      exchangeType: 'topic',
      queueOptions: { durable: true },
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [uri],
      queue: config.getOrThrow<string>('RABBITMQ_CONFIRMATION_QUEUE'),
      prefetchCount,
      noAck: false,
      persistent: true,
      exchange: 'amq.topic',
      exchangeType: 'topic',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.init();

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
}

void bootstrap();
