// Import this first!
import "./instrument";

// Now import other modules
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module-custom-filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(Number(process.env.APP_PORT) || 3000);
}

bootstrap();
