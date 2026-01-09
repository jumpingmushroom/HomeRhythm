import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { backupService } from '../services/backup.service';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/backup/create
 * Create a manual backup
 */
router.post('/create', async (req: AuthRequest, res) => {
  try {
    console.log(`[Backup API] Manual backup requested by user ${req.userId}`);

    const result = await backupService.performBackup();

    if (result.success) {
      res.json({
        message: 'Backup created successfully',
        filename: result.filename,
        timestamp: result.timestamp,
      });
    } else {
      res.status(500).json({
        error: 'Failed to create backup',
        details: result.error,
      });
    }
  } catch (error) {
    console.error('[Backup API] Create backup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/backup/list
 * List all backups with metadata
 */
router.get('/list', (req: AuthRequest, res) => {
  try {
    const backups = backupService.listBackups();

    const backupList = backups.map(backup => ({
      filename: backup.filename,
      size: backup.size,
      created: backup.created.toISOString(),
    }));

    res.json({
      count: backupList.length,
      backups: backupList,
    });
  } catch (error) {
    console.error('[Backup API] List backups error:', error);
    res.status(500).json({
      error: 'Failed to list backups',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/backup/download/:filename
 * Download a specific backup file
 */
router.get('/download/:filename', (req: AuthRequest, res) => {
  try {
    const { filename } = req.params;

    console.log(`[Backup API] Download requested by user ${req.userId}: ${filename}`);

    const result = backupService.getBackupPath(filename);

    if (!result.success || !result.path) {
      res.status(result.error?.includes('path traversal') ? 400 : 404).json({
        error: result.error || 'Backup not found',
      });
      return;
    }

    // Send file with appropriate headers
    res.download(result.path, filename, (err) => {
      if (err) {
        console.error('[Backup API] Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download backup' });
        }
      }
    });
  } catch (error) {
    console.error('[Backup API] Download backup error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to download backup',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

/**
 * GET /api/backup/download-current
 * Download the current database with timestamp
 */
router.get('/download-current', (req: AuthRequest, res) => {
  try {
    console.log(`[Backup API] Current database download requested by user ${req.userId}`);

    if (!fs.existsSync(config.database.path)) {
      res.status(404).json({ error: 'Database file not found' });
      return;
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const dbName = path.basename(config.database.path, path.extname(config.database.path));
    const dbExt = path.extname(config.database.path);
    const filename = `${dbName}_current_${timestamp}${dbExt}`;

    // Send file with custom filename
    res.download(config.database.path, filename, (err) => {
      if (err) {
        console.error('[Backup API] Download current database error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download database' });
        }
      }
    });
  } catch (error) {
    console.error('[Backup API] Download current database error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to download current database',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

/**
 * DELETE /api/backup/cleanup
 * Manual cleanup with optional keep_count parameter
 */
router.delete('/cleanup', async (req: AuthRequest, res) => {
  try {
    const { keep_count } = req.query;

    console.log(`[Backup API] Manual cleanup requested by user ${req.userId}`);

    // If keep_count is provided, perform simple cleanup keeping only N newest backups
    if (keep_count) {
      const keepCount = parseInt(keep_count as string, 10);

      if (isNaN(keepCount) || keepCount < 0) {
        res.status(400).json({ error: 'Invalid keep_count parameter' });
        return;
      }

      const backups = backupService.listBackups();
      const backupsToDelete = backups.slice(keepCount);

      let deletedCount = 0;
      for (const backup of backupsToDelete) {
        try {
          fs.unlinkSync(backup.path);
          deletedCount++;
        } catch (error) {
          console.error(`[Backup API] Failed to delete ${backup.filename}:`, error);
        }
      }

      res.json({
        message: 'Cleanup completed',
        deleted: deletedCount,
        kept: backups.length - deletedCount,
      });
    } else {
      // Use standard tiered retention policy
      const result = await backupService.performCleanup();

      res.json({
        message: 'Cleanup completed',
        deleted: result.deletedCount,
      });
    }
  } catch (error) {
    console.error('[Backup API] Cleanup error:', error);
    res.status(500).json({
      error: 'Failed to perform cleanup',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/backup/status
 * Get backup system status
 */
router.get('/status', (req: AuthRequest, res) => {
  try {
    const status = backupService.getStatus();

    res.json({
      enabled: status.enabled,
      lastBackup: status.lastBackup?.toISOString(),
      lastBackupFilename: status.lastBackupFilename,
      backupCount: status.backupCount,
      totalSize: status.totalSize,
      backupDirectory: config.backup.dir,
      intervalHours: config.backup.intervalHours,
    });
  } catch (error) {
    console.error('[Backup API] Status error:', error);
    res.status(500).json({
      error: 'Failed to get backup status',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
