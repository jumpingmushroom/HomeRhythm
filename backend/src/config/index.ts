import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    path: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'homeRhythm.db'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    fromName: process.env.EMAIL_FROM_NAME || 'HomeRhythm',
  },
  notifications: {
    defaultDueSoonDays: parseInt(process.env.NOTIFICATION_DUE_SOON_DAYS || '3', 10),
    digestDefaultTime: process.env.DIGEST_DEFAULT_TIME || '09:00',
    maxRetries: parseInt(process.env.EMAIL_MAX_RETRIES || '3', 10),
  },
  backup: {
    enabled: process.env.BACKUP_ENABLED !== 'false', // Default to true
    dir: process.env.BACKUP_DIR || path.join(process.cwd(), 'data', 'backups'),
    intervalHours: parseInt(process.env.BACKUP_INTERVAL_HOURS || '1', 10),
    retention: {
      hourlyCount: parseInt(process.env.BACKUP_RETENTION_HOURLY || '24', 10), // Last 24 hours
      dailyCount: parseInt(process.env.BACKUP_RETENTION_DAILY || '7', 10), // Last 7 days
      weeklyCount: parseInt(process.env.BACKUP_RETENTION_WEEKLY || '4', 10), // Last 4 weeks
      monthlyCount: parseInt(process.env.BACKUP_RETENTION_MONTHLY || '12', 10), // Last 12 months
    },
  },
};
