import './instrument';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(Number(process.env.APP_PORT));
  // eslint-disable-next-line no-console
  console.log('listening on', process.env.APP_PORT);
}

void bootstrap();
