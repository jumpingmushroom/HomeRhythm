import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';
import { config } from './config';
import { runMigrations } from './database/migrate';
import { schedulerService } from './services/scheduler.service';
import { backupService } from './services/backup.service';
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import completionRoutes from './routes/completions';
import photoRoutes from './routes/photos';
import templateRoutes from './routes/templates';
import userRoutes from './routes/users';
import notificationPreferencesRoutes from './routes/notification-preferences';
import householdRoutes from './routes/households';
import activityRoutes from './routes/activities';
import backupRoutes from './routes/backup';
import subtasksRoutes from './routes/subtasks';
import commentsRoutes from './routes/comments';
import timeTrackingRoutes from './routes/time-tracking';
import dependenciesRoutes from './routes/dependencies';

const app = express();

// Middleware
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: config.upload.maxFileSize },
  abortOnLimit: true,
}));

// Serve static frontend files in production
if (config.nodeEnv === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/completions', completionRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notification-preferences', notificationPreferencesRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/subtasks', subtasksRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/dependencies', dependenciesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const backupStatus = backupService.getStatus();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    backup: {
      enabled: backupStatus.enabled,
      lastBackup: backupStatus.lastBackup?.toISOString(),
      backupCount: backupStatus.backupCount,
      totalSize: backupStatus.totalSize,
    },
  });
});

// Serve frontend for all other routes in production
if (config.nodeEnv === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Initialize database and start server
async function start() {
  try {
    console.log('Running database migrations...');
    runMigrations();
    console.log('Database ready');

    // Initialize scheduler for notifications and backups
    if (config.email?.enabled || config.backup?.enabled) {
      console.log('Initializing scheduler...');
      schedulerService.initialize();
    } else {
      console.log('Email notifications and backups disabled, scheduler not started');
    }

    app.listen(config.port, () => {
      console.log(`HomeRhythm server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
