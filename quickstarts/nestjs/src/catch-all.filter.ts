import { Catch, ExceptionFilter } from "@nestjs/common";
import { SentryExceptionCaptured } from "@sentry/nestjs";

@Catch()
export class YourCatchAllExceptionFilter implements ExceptionFilter {
  @SentryExceptionCaptured()
  catch(exception, host): void {
    // your implementation here
    const res = host.switchToHttp().getResponse();
    const status = typeof exception?.getStatus === "function" ? exception.getStatus() : 500;
    res.status(status).json({ statusCode: status, message: String(exception?.message ?? exception) });
  }
}
