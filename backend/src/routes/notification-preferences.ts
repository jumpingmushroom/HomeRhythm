import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { emailService } from '../services/email.service';
import { z } from 'zod';
import { validateRequest } from '../utils/validation';
import { getDatabase } from '../database';
import { User } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get current user's notification preferences
router.get('/', (req: AuthRequest, res) => {
  try {
    const preferences = notificationService.getUserPreferences(req.userId!);
    res.json({ preferences });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// Update notification preferences
const updatePreferencesSchema = z.object({
  notifications_enabled: z.number().int().min(0).max(1).optional(),
  task_due_soon_days: z.number().int().min(1).max(30).optional(),
  task_due_soon_enabled: z.number().int().min(0).max(1).optional(),
  task_overdue_enabled: z.number().int().min(0).max(1).optional(),
  task_assigned_enabled: z.number().int().min(0).max(1).optional(),
  digest_enabled: z.number().int().min(0).max(1).optional(),
  digest_frequency: z.enum(['daily', 'weekly']).optional(),
  digest_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  digest_day_of_week: z.number().int().min(1).max(7).optional(),
});

router.put('/', (req: AuthRequest, res) => {
  const validation = validateRequest(updatePreferencesSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  try {
    const preferences = notificationService.updateUserPreferences(
      req.userId!,
      validation.data
    );
    res.json({ message: 'Preferences updated successfully', preferences });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// Send test email
router.post('/test', async (req: AuthRequest, res) => {
  try {
    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId!) as User;

    const result = await emailService.sendEmail(
      user.email,
      'Test Email from HomeRhythm',
      '<h1>Test Successful!</h1><p>Your email notifications are configured correctly.</p>',
      'test',
      req.userId!,
      undefined,
      new Date().toISOString().split('T')[0]
    );

    if (result.success) {
      res.json({ message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ error: result.error || 'Failed to send test email' });
    }
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message || 'Failed to send test email' });
  }
});

export default router;
