import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';
import { getDatabase } from '../database';

class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      if (!config.email.enabled) {
        throw new Error('Email service is not enabled');
      }

      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });
    }
    return this.transporter;
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    type: string,
    userId: number,
    taskId?: number,
    referenceDate?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!config.email.enabled) {
      console.log('[Email] Email disabled, skipping:', { to, subject, type });
      return { success: true }; // Don't fail if disabled
    }

    const db = getDatabase();
    const logData = {
      user_id: userId,
      task_id: taskId || null,
      notification_type: type,
      reference_date: referenceDate || new Date().toISOString().split('T')[0],
    };

    try {
      // Check for duplicate notification
      const existing = db.prepare(`
        SELECT id FROM notification_logs
        WHERE user_id = ? AND task_id = ? AND notification_type = ? AND reference_date = ?
        AND sent_at > datetime('now', '-24 hours')
      `).get(logData.user_id, logData.task_id, logData.notification_type, logData.reference_date);

      if (existing) {
        console.log('[Email] Duplicate notification prevented:', logData);
        return { success: true }; // Already sent recently
      }

      const transporter = this.getTransporter();

      await transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.from}>`,
        to,
        subject,
        html,
      });

      // Log successful send
      db.prepare(`
        INSERT INTO notification_logs
        (user_id, task_id, notification_type, reference_date, status)
        VALUES (?, ?, ?, ?, 'sent')
      `).run(logData.user_id, logData.task_id, logData.notification_type, logData.reference_date);

      console.log('[Email] Sent successfully:', { to, subject, type });
      return { success: true };

    } catch (error: any) {
      console.error('[Email] Failed to send:', error);

      // Log failure
      db.prepare(`
        INSERT INTO notification_logs
        (user_id, task_id, notification_type, reference_date, status, error_message)
        VALUES (?, ?, ?, ?, 'failed', ?)
      `).run(logData.user_id, logData.task_id, logData.notification_type, logData.reference_date, error.message);

      return { success: false, error: error.message };
    }
  }

  async testConnection(): Promise<boolean> {
    if (!config.email.enabled) {
      console.log('[Email] Email service is disabled');
      return false;
    }

    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      console.log('[Email] Connection verified successfully');
      return true;
    } catch (error) {
      console.error('[Email] Connection verification failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
