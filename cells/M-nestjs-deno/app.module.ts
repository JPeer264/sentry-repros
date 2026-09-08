import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryModule, SentryGlobalFilter } from "@sentry/nestjs/setup";
import { AppController } from "./app.controller.ts";

// SentryModule.forRoot() alone registers only APP_INTERCEPTOR; without the explicit
// APP_FILTER every route-handler error is swallowed and no event is sent.
const providers = Deno.env.get("NO_FILTER") ? [] : [{ provide: APP_FILTER, useClass: SentryGlobalFilter }];

@Module({
  imports: [SentryModule.forRoot()],
  controllers: [AppController],
  providers,
})
export class AppModule {}
