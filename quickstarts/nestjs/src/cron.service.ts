import { Injectable } from "@nestjs/common";
import { Cron } from '@nestjs/schedule';
import { SentryCron } from '@sentry/nestjs';

@Injectable()
export class MyCronService {
  @Cron('* * * * *')
  @SentryCron('my-monitor-slug', {
    schedule: {
      type: "crontab",
      value: "* * * * *",
    },
    checkinMargin: 2, // In minutes. Optional.
    maxRuntime: 10, // In minutes. Optional.
    timezone: "America/Los_Angeles", // Optional.
  })
  handleCron() {
    // Your cron job logic here
    return "cron ran";
  }
}
