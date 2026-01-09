import { getDatabase } from '../database';
import { Task, User, NotificationPreferences } from '../types';
import { emailService } from './email.service';
import { dateCalculatorService } from './date-calculator.service';
import { emailTemplates } from '../utils/email-templates';

class NotificationService {

  /**
   * Get or create notification preferences for a user
   */
  getUserPreferences(userId: number): NotificationPreferences {
    const db = getDatabase();

    let prefs = db.prepare(
      'SELECT * FROM user_notification_preferences WHERE user_id = ?'
    ).get(userId) as NotificationPreferences | undefined;

    if (!prefs) {
      // Create default preferences
      const result = db.prepare(`
        INSERT INTO user_notification_preferences (user_id) VALUES (?)
      `).run(userId);

      prefs = db.prepare(
        'SELECT * FROM user_notification_preferences WHERE id = ?'
      ).get(result.lastInsertRowid) as NotificationPreferences;
    }

    return prefs;
  }

  /**
   * Update notification preferences
   */
  updateUserPreferences(userId: number, updates: Partial<NotificationPreferences>): NotificationPreferences {
    const db = getDatabase();

    // Ensure preferences exist
    this.getUserPreferences(userId);

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length > 0) {
      updateFields.push('updated_at = datetime(\'now\')');
      params.push(userId);

      db.prepare(`
        UPDATE user_notification_preferences
        SET ${updateFields.join(', ')}
        WHERE user_id = ?
      `).run(...params);
    }

    return this.getUserPreferences(userId);
  }

  /**
   * Send "task due soon" notifications
   */
  async sendDueSoonNotifications(): Promise<void> {
    const db = getDatabase();

    // Get all users with notifications enabled
    const users = db.prepare(`
      SELECT u.*, p.*
      FROM users u
      JOIN user_notification_preferences p ON u.id = p.user_id
      WHERE p.notifications_enabled = 1 AND p.task_due_soon_enabled = 1
    `).all() as (User & NotificationPreferences)[];

    console.log(`[Notifications] Checking due soon tasks for ${users.length} users`);

    for (const user of users) {
      try {
        const tasks = this.getTasksDueSoon(user.id, user.task_due_soon_days);

        for (const task of tasks) {
          const status = dateCalculatorService.calculateTaskStatus(task);

          if (status.daysUntilDue && status.daysUntilDue > 0) {
            const html = emailTemplates.taskDueSoon(task, user, status.daysUntilDue);

            await emailService.sendEmail(
              user.email,
              `Task due in ${status.daysUntilDue} day${status.daysUntilDue !== 1 ? 's' : ''}: ${task.title}`,
              html,
              'due_soon',
              user.id,
              task.id,
              status.nextDueDate || undefined
            );
          }
        }
      } catch (error) {
        console.error(`[Notifications] Error processing user ${user.id}:`, error);
      }
    }
  }

  /**
   * Send "task overdue" notifications
   */
  async sendOverdueNotifications(): Promise<void> {
    const db = getDatabase();

    const users = db.prepare(`
      SELECT u.*, p.*
      FROM users u
      JOIN user_notification_preferences p ON u.id = p.user_id
      WHERE p.notifications_enabled = 1 AND p.task_overdue_enabled = 1
    `).all() as (User & NotificationPreferences)[];

    console.log(`[Notifications] Checking overdue tasks for ${users.length} users`);

    for (const user of users) {
      try {
        const tasks = this.getOverdueTasks(user.id);

        for (const task of tasks) {
          const status = dateCalculatorService.calculateTaskStatus(task);

          if (status.isOverdue && status.daysUntilDue) {
            const daysOverdue = Math.abs(status.daysUntilDue);
            const html = emailTemplates.taskOverdue(task, user, daysOverdue);

            await emailService.sendEmail(
              user.email,
              `Task overdue: ${task.title}`,
              html,
              'overdue',
              user.id,
              task.id,
              status.nextDueDate || undefined
            );
          }
        }
      } catch (error) {
        console.error(`[Notifications] Error processing user ${user.id}:`, error);
      }
    }
  }

  /**
   * Send task assigned notification
   */
  async sendTaskAssignedNotification(task: Task): Promise<void> {
    if (!task.assigned_to) return;

    const db = getDatabase();

    // Get assigned user and their preferences
    const assignedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(task.assigned_to) as User | undefined;
    if (!assignedUser) return;

    const prefs = this.getUserPreferences(assignedUser.id);
    if (!prefs.notifications_enabled || !prefs.task_assigned_enabled) {
      return;
    }

    // Get the user who created/assigned the task
    const assignedBy = db.prepare('SELECT * FROM users WHERE id = ?').get(task.user_id) as User;

    const html = emailTemplates.taskAssigned(task, assignedBy, assignedUser);

    await emailService.sendEmail(
      assignedUser.email,
      `New task assigned: ${task.title}`,
      html,
      'assigned',
      assignedUser.id,
      task.id,
      new Date().toISOString().split('T')[0]
    );
  }

  /**
   * Send digest notifications
   */
  async sendDigestNotifications(frequency: 'daily' | 'weekly'): Promise<void> {
    const db = getDatabase();

    const users = db.prepare(`
      SELECT u.*, p.*
      FROM users u
      JOIN user_notification_preferences p ON u.id = p.user_id
      WHERE p.notifications_enabled = 1
        AND p.digest_enabled = 1
        AND p.digest_frequency = ?
    `).all(frequency) as (User & NotificationPreferences)[];

    console.log(`[Notifications] Sending ${frequency} digest to ${users.length} users`);

    for (const user of users) {
      try {
        const dueSoonTasks = this.getTasksDueSoon(user.id, user.task_due_soon_days);
        const overdueTasks = this.getOverdueTasks(user.id);

        let html: string;
        let subject: string;

        if (frequency === 'weekly') {
          const completedCount = this.getWeeklyCompletedCount(user.id);
          html = emailTemplates.weeklyDigest(user, dueSoonTasks, overdueTasks, completedCount);
          subject = 'Your Weekly Task Summary';
        } else {
          html = emailTemplates.dailyDigest(user, dueSoonTasks, overdueTasks);
          subject = 'Your Daily Task Digest';
        }

        await emailService.sendEmail(
          user.email,
          subject,
          html,
          'digest',
          user.id,
          undefined,
          new Date().toISOString().split('T')[0]
        );
      } catch (error) {
        console.error(`[Notifications] Error sending digest to user ${user.id}:`, error);
      }
    }
  }

  /**
   * Get tasks due soon for a user
   */
  private getTasksDueSoon(userId: number, dueSoonDays: number): Task[] {
    const db = getDatabase();
    const tasks = db.prepare(`
      SELECT * FROM tasks
      WHERE (user_id = ? OR assigned_to = ?)
    `).all(userId, userId) as Task[];

    return tasks.filter(task => {
      const status = dateCalculatorService.calculateTaskStatus(task);
      return status.daysUntilDue !== null &&
             status.daysUntilDue > 0 &&
             status.daysUntilDue <= dueSoonDays;
    });
  }

  /**
   * Get overdue tasks for a user
   */
  private getOverdueTasks(userId: number): Task[] {
    const db = getDatabase();
    const tasks = db.prepare(`
      SELECT * FROM tasks
      WHERE (user_id = ? OR assigned_to = ?)
    `).all(userId, userId) as Task[];

    return tasks.filter(task => {
      const status = dateCalculatorService.calculateTaskStatus(task);
      return status.isOverdue;
    });
  }

  /**
   * Get count of tasks completed this week
   */
  private getWeeklyCompletedCount(userId: number): number {
    const db = getDatabase();
    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM task_completions tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE t.user_id = ?
        AND tc.completed_at >= date('now', '-7 days')
    `).get(userId) as { count: number };

    return result.count;
  }
}

export const notificationService = new NotificationService();
