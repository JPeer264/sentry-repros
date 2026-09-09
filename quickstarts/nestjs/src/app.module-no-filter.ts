import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { SentryModule } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MyService } from "./my.service";
import { MyCronService } from "./cron.service";
import { AuditMiddleware } from "./audit.middleware";

@Module({
  imports: [
    SentryModule.forRoot(),
    // ...other modules
  ],
  controllers: [AppController],
  providers: [
    // ..other providers
    AppService,
    MyService,
    MyCronService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes(AppController);
  }
}
