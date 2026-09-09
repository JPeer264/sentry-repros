import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryModule } from "@sentry/nestjs/setup";
import { YourCatchAllExceptionFilter } from "./catch-all.filter";
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
    {
      provide: APP_FILTER,
      useClass: YourCatchAllExceptionFilter,
    },
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
