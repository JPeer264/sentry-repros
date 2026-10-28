import * as Sentry from '@sentry/node';
import nodeSchedule from 'node-schedule';

// `nodeScheduleIntegration` (PR #25474) monitors jobs by itself. The released API needs the wrapper.
const schedule = process.env.USE_INTEGRATION ? nodeSchedule : Sentry.cron.instrumentNodeSchedule(nodeSchedule);

// A job that ends at once sends its `ok` check-in before Sentry has created the monitor, and Sentry drops it.
const job = name => () =>
  new Promise(resolve =>
    setTimeout(() => {
      console.log(`job ran    ${name}`);
      resolve();
    }, 2000),
  );

// The node-schedule README documents both ways to create a job. Both jobs run every day at 09:00.
const fromScheduleJob = schedule.scheduleJob('schedule-job', '0 9 * * *', job('schedule-job'));

const fromNewJob = new schedule.Job('new-job', job('new-job'));
fromNewJob.schedule('0 9 * * *');

// Run the jobs without waiting for their schedule.
for (const scheduled of [fromScheduleJob, fromNewJob]) {
  await scheduled.invoke();
  scheduled.cancel();
}

await Sentry.flush(5000);
