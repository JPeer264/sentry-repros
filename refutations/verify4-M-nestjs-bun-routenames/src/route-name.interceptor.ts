import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import * as Sentry from '@sentry/bun';
import type { Observable } from 'rxjs';

@Injectable()
export class RouteNameInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const route = req.route?.path;
    const span = Sentry.getActiveSpan();
    console.log('[probe] interceptor: route=', route, 'activeSpan=', !!span);
    if (span && route) {
      const root = Sentry.getRootSpan(span);
      root.updateName(`${req.method} ${route}`);
      root.setAttribute('sentry.source', 'route');
      root.setAttribute('http.route', route);
    }
    return next.handle();
  }
}
