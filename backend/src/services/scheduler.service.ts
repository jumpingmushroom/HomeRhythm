import cron from 'node-cron';
import { notificationService } from './notification.service';
import { emailService } from './email.service';
import { config } from '../config';

class SchedulerService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all scheduled jobs
   */
  initialize(): void {
    console.log('[Scheduler] Initializing notification jobs...');

    // Check for due soon tasks every hour
    this.scheduleJob('due-soon-check', '0 * * * *', async () => {
      console.log('[Scheduler] Running due soon check...');
      await notificationService.sendDueSoonNotifications();
    });

    // Check for overdue tasks every 6 hours
    this.scheduleJob('overdue-check', '0 */6 * * *', async () => {
      console.log('[Scheduler] Running overdue check...');
      await notificationService.sendOverdueNotifications();
    });

    // Send daily digest at 9 AM (configurable)
    const [hour, minute] = (config.notifications?.digestDefaultTime || '09:00').split(':');
    this.scheduleJob('daily-digest', `${minute} ${hour} * * *`, async () => {
      console.log('[Scheduler] Sending daily digests...');
      await notificationService.sendDigestNotifications('daily');
    });

    // Send weekly digest on Monday at 9 AM
    this.scheduleJob('weekly-digest', `${minute} ${hour} * * 1`, async () => {
      console.log('[Scheduler] Sending weekly digests...');
      await notificationService.sendDigestNotifications('weekly');
    });

    // Test email connection on startup and daily
    this.scheduleJob('email-health-check', '0 0 * * *', async () => {
      console.log('[Scheduler] Running email health check...');
      await emailService.testConnection();
    });

    console.log('[Scheduler] All jobs scheduled');
  }

  /**
   * Schedule a job
   */
  private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>): void {
    if (this.jobs.has(name)) {
      console.log(`[Scheduler] Job ${name} already exists, stopping old job`);
      this.jobs.get(name)?.stop();
    }

    const job = cron.schedule(cronExpression, async () => {
      try {
        await task();
      } catch (error) {
        console.error(`[Scheduler] Job ${name} failed:`, error);
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York', // Configure as needed
    });

    this.jobs.set(name, job);
    console.log(`[Scheduler] Scheduled job: ${name} (${cronExpression})`);
  }

  /**
   * Stop a specific job
   */
  stopJob(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`[Scheduler] Stopped job: ${name}`);
    }
  }

  /**
   * Stop all jobs
   */
  stopAll(): void {
    console.log('[Scheduler] Stopping all jobs...');
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`[Scheduler] Stopped job: ${name}`);
    });
    this.jobs.clear();
  }

  /**
   * Get status of all jobs
   */
  getStatus(): Array<{ name: string; running: boolean }> {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: true, // node-cron doesn't expose running status easily
    }));
  }
}

export const schedulerService = new SchedulerService();
