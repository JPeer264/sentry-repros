import { Controller, Get, HttpException, NotFoundException, Param, ServiceUnavailableException } from "@nestjs/common";
import * as Sentry from "@sentry/nestjs";
import { AppService } from "./app.service";
import { MyService } from "./my.service";
import { MyCronService } from "./cron.service";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly myService: MyService,
    private readonly cronService: MyCronService,
  ) {}

  @Get("/users/:id")
  getUser(@Param("id") id: string) {
    return { ...this.appService.getUser(id), ...this.myService.myFunction() };
  }

  // platform-includes/getting-started-verify/javascript.nestjs.mdx:13-16 verbatim
  @Get("/debug-sentry")
  getError() {
    throw new Error("My first Sentry error!");
  }

  // platform-includes/getting-started-verify/javascript.nestjs.mdx:36-49 verbatim except the path
  @Get("/debug-sentry-tracing")
  getErrorTracing() {
    Sentry.startSpan(
      {
        op: "test",
        name: "My First Test Transaction",
      },
      () => {
        setTimeout(() => {
          throw new Error("My first Sentry error!");
        }, 99);
      },
    );
  }

  @Get("/error-404")
  error404() {
    throw new NotFoundException("custom 404");
  }

  @Get("/error-503")
  error503() {
    throw new ServiceUnavailableException("custom 503");
  }

  @Get("/error-500-http")
  error500() {
    throw new HttpException("custom 500", 500);
  }

  // includes/logs/javascript-quick-start-verify-logs-splitlayout.mdx:13
  @Get("/debug-log")
  debugLog() {
    Sentry.logger.info("User example action completed");
    return { logged: true };
  }

  @Get("/cron")
  cron() {
    return { cron: this.cronService.handleCron() };
  }

  @Get("/sentinel")
  sentinel() {
    Sentry.captureMessage("sentinel");
    return { ok: true };
  }
}
