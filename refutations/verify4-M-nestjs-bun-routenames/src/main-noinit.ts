import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(Number(process.env.APP_PORT));
  console.log('listening on', process.env.APP_PORT);
}

void bootstrap();
