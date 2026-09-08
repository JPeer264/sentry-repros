import { Controller, Get, Module, Param } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { SentryGlobalFilter, SentryModule } from "@sentry/nestjs/setup";

@Controller()
export class AppController {
  @Get("/users/:id")
  getUser(@Param("id") id: string) {
    return { id };
  }

  @Get("/ok")
  ok() {
    return { ok: true };
  }
}

@Module({
  imports: [SentryModule.forRoot()],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: SentryGlobalFilter }],
})
export class AppModule {}
