import './instrument';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RouteName2Interceptor } from './route-name2.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new RouteName2Interceptor());
  await app.listen(Number(process.env.APP_PORT));
  console.log('listening on', process.env.APP_PORT);
}

void bootstrap();
