import { Injectable } from "@nestjs/common";
import { SentryTraced } from '@sentry/nestjs';

@Injectable()
export class MyService {
  @SentryTraced()
  myFunction() {
    // Your function logic here
    return { traced: true };
  }
}
