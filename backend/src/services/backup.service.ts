import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { emailService } from './email.service';

interface BackupMetadata {
  filename: string;
  size: number;
  created: Date;
  path: string;
}

interface BackupResult {
  success: boolean;
  filename?: string;
  timestamp?: string;
  error?: string;
}

interface BackupStatus {
  enabled: boolean;
  lastBackup?: Date;
  lastBackupFilename?: string;
  backupCount: number;
  totalSize: number;
}

class BackupService {
  private lastBackupTime?: Date;
  private lastBackupFilename?: string;

  /**
   * Perform a database backup
   */
  async performBackup(): Promise<BackupResult> {
    const timestamp = new Date();
    const timestampStr = this.formatTimestamp(timestamp);

    try {
      // Ensure backup directory exists
      if (!fs.existsSync(config.backup.dir)) {
        fs.mkdirSync(config.backup.dir, { recursive: true });
        console.log(`[Backup] Created backup directory: ${config.backup.dir}`);
      }

      // Check if source database exists
      if (!fs.existsSync(config.database.path)) {
        const error = 'Database file does not exist';
        console.error(`[Backup] ${error}: ${config.database.path}`);
        return { success: false, error };
      }

      // Generate backup filename
      const dbName = path.basename(config.database.path, path.extname(config.database.path));
      const dbExt = path.extname(config.database.path);
      const filename = `${dbName}_backup_${timestampStr}${dbExt}`;
      const backupPath = path.join(config.backup.dir, filename);

      // Copy database file (preserves metadata)
      fs.copyFileSync(config.database.path, backupPath);

      // Verify backup was created
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created');
      }

      const stats = fs.statSync(backupPath);

      this.lastBackupTime = timestamp;
      this.lastBackupFilename = filename;

      console.log(`[Backup] Successfully created backup: ${filename} (${this.formatSize(stats.size)})`);

      // Run cleanup after successful backup
      await this.performCleanup();

      return {
        success: true,
        filename,
        timestamp: timestamp.toISOString(),
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Backup] Failed to create backup:`, error);

      // Send email notification on failure
      if (config.email?.enabled) {
        try {
          await this.sendBackupFailureNotification(errorMsg);
        } catch (emailError) {
          console.error(`[Backup] Failed to send failure notification:`, emailError);
        }
      }

      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Perform cleanup according to tiered retention policy
   */
  async performCleanup(): Promise<{ deletedCount: number }> {
    try {
      const backups = this.listBackups();

      if (backups.length === 0) {
        return { deletedCount: 0 };
      }

      // Sort backups by creation time (newest first)
      const sortedBackups = backups.sort((a, b) => b.created.getTime() - a.created.getTime());

      const now = new Date();
      const backupsToKeep = new Set<string>();

      // 1. Keep ALL backups from last 24 hours
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      sortedBackups.forEach(backup => {
        if (backup.created >= last24Hours) {
          backupsToKeep.add(backup.filename);
        }
      });

      // 2. Keep DAILY backups for last 7 days (one per day, preferably midnight)
      const dailyBackups = this.selectDailyBackups(sortedBackups, 7, last24Hours);
      dailyBackups.forEach(backup => backupsToKeep.add(backup.filename));

      // 3. Keep WEEKLY backups for last 4 weeks (Sundays, preferably midnight)
      const weeklyBackups = this.selectWeeklyBackups(sortedBackups, 4);
      weeklyBackups.forEach(backup => backupsToKeep.add(backup.filename));

      // 4. Keep MONTHLY backups for last 12 months (1st of month, preferably midnight)
      const monthlyBackups = this.selectMonthlyBackups(sortedBackups, 12);
      monthlyBackups.forEach(backup => backupsToKeep.add(backup.filename));

      // Delete backups not in the keep set
      let deletedCount = 0;
      for (const backup of sortedBackups) {
        if (!backupsToKeep.has(backup.filename)) {
          try {
            fs.unlinkSync(backup.path);
            deletedCount++;
            console.log(`[Backup] Deleted old backup: ${backup.filename}`);
          } catch (error) {
            console.error(`[Backup] Failed to delete backup ${backup.filename}:`, error);
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`[Backup] Cleanup completed: deleted ${deletedCount} backup(s), kept ${backupsToKeep.size}`);
      }

      return { deletedCount };
    } catch (error) {
      console.error(`[Backup] Cleanup failed:`, error);
      return { deletedCount: 0 };
    }
  }

  /**
   * Select daily backups (one per day for the last N days)
   */
  private selectDailyBackups(backups: BackupMetadata[], days: number, startFrom: Date): BackupMetadata[] {
    const selected: BackupMetadata[] = [];
    const seenDays = new Set<string>();

    for (const backup of backups) {
      if (backup.created < startFrom) {
        const dayKey = backup.created.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!seenDays.has(dayKey) && seenDays.size < days) {
          selected.push(backup);
          seenDays.add(dayKey);
        }
      }
    }

    return selected;
  }

  /**
   * Select weekly backups (one per week for the last N weeks, preferably Sunday)
   */
  private selectWeeklyBackups(backups: BackupMetadata[], weeks: number): BackupMetadata[] {
    const selected: BackupMetadata[] = [];
    const seenWeeks = new Set<string>();

    for (const backup of backups) {
      const weekKey = this.getWeekKey(backup.created);
      if (!seenWeeks.has(weekKey) && seenWeeks.size < weeks) {
        // Prefer Sunday backups (day 0)
        const isSunday = backup.created.getDay() === 0;
        const existing = selected.find(b => this.getWeekKey(b.created) === weekKey);

        if (!existing) {
          selected.push(backup);
          seenWeeks.add(weekKey);
        } else if (isSunday && existing.created.getDay() !== 0) {
          // Replace non-Sunday with Sunday
          const index = selected.indexOf(existing);
          selected[index] = backup;
        }
      }
    }

    return selected;
  }

  /**
   * Select monthly backups (one per month for the last N months, preferably 1st of month)
   */
  private selectMonthlyBackups(backups: BackupMetadata[], months: number): BackupMetadata[] {
    const selected: BackupMetadata[] = [];
    const seenMonths = new Set<string>();

    for (const backup of backups) {
      const monthKey = `${backup.created.getFullYear()}-${String(backup.created.getMonth() + 1).padStart(2, '0')}`;
      if (!seenMonths.has(monthKey) && seenMonths.size < months) {
        const isFirstOfMonth = backup.created.getDate() === 1;
        const existing = selected.find(b => {
          const existingKey = `${b.created.getFullYear()}-${String(b.created.getMonth() + 1).padStart(2, '0')}`;
          return existingKey === monthKey;
        });

        if (!existing) {
          selected.push(backup);
          seenMonths.add(monthKey);
        } else if (isFirstOfMonth && existing.created.getDate() !== 1) {
          // Replace non-first-of-month with first-of-month
          const index = selected.indexOf(existing);
          selected[index] = backup;
        }
      }
    }

    return selected;
  }

  /**
   * Get week key (ISO week format: YYYY-Www)
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const weekNum = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }

  /**
   * List all backups with metadata
   */
  listBackups(): BackupMetadata[] {
    try {
      if (!fs.existsSync(config.backup.dir)) {
        return [];
      }

      const files = fs.readdirSync(config.backup.dir);
      const backups: BackupMetadata[] = [];

      for (const file of files) {
        // Only include backup files
        if (!file.includes('_backup_')) {
          continue;
        }

        const filePath = path.join(config.backup.dir, file);
        try {
          const stats = fs.statSync(filePath);
          backups.push({
            filename: file,
            size: stats.size,
            created: stats.mtime,
            path: filePath,
          });
        } catch (error) {
          console.error(`[Backup] Failed to read backup file ${file}:`, error);
        }
      }

      // Sort by modification time (newest first)
      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error(`[Backup] Failed to list backups:`, error);
      return [];
    }
  }

  /**
   * Get backup status
   */
  getStatus(): BackupStatus {
    const backups = this.listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

    return {
      enabled: config.backup.enabled,
      lastBackup: this.lastBackupTime,
      lastBackupFilename: this.lastBackupFilename,
      backupCount: backups.length,
      totalSize,
    };
  }

  /**
   * Get backup by filename (with security validation)
   */
  getBackupPath(filename: string): { success: boolean; path?: string; error?: string } {
    // Security: Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return {
        success: false,
        error: 'Invalid filename: path traversal attempt detected',
      };
    }

    const backupPath = path.join(config.backup.dir, filename);

    // Ensure the resolved path is within backup directory
    if (!backupPath.startsWith(config.backup.dir)) {
      return {
        success: false,
        error: 'Invalid filename: outside backup directory',
      };
    }

    // Check if file exists
    if (!fs.existsSync(backupPath)) {
      return {
        success: false,
        error: 'Backup file not found',
      };
    }

    return {
      success: true,
      path: backupPath,
    };
  }

  /**
   * Format timestamp for backup filename
   */
  private formatTimestamp(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  /**
   * Format file size for display
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Send backup failure notification email
   */
  private async sendBackupFailureNotification(error: string): Promise<void> {
    // Get admin users from database (simplified - you might want to query actual admin users)
    const subject = 'HomeRhythm Backup Failed';
    const html = `
      <h2>Backup Failure Alert</h2>
      <p>A scheduled backup of the HomeRhythm database failed.</p>
      <p><strong>Error:</strong> ${error}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Database:</strong> ${config.database.path}</p>
      <p>Please check the server logs for more details.</p>
    `;

    // Send to admin email if configured
    if (config.email?.user) {
      // Use userId: 0 for system notifications
      await emailService.sendEmail(
        config.email.user,
        subject,
        html,
        'backup-failure',
        0 // System user ID
      );
    }
  }
}

export const backupService = new BackupService();
