import './instrument';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RouteNameInterceptor } from './route-name.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new RouteNameInterceptor());
  await app.listen(Number(process.env.APP_PORT));
  console.log('listening on', process.env.APP_PORT);
}

void bootstrap();
