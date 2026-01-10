import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, timeEntryStartSchema, timeEntryStopSchema, timeEntryUpdateSchema } from '../utils/validation';
import { TaskTimeEntry, TaskTimeEntrySummary, Task } from '../types';
import { activityService } from '../services/activity.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all time entries for a task
router.get('/task/:taskId', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const db = getDatabase();

  try {
    // Verify task access
    const task = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(taskId) as (Task & { creator_household_id: number | null }) | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentUser = db.prepare('SELECT household_id FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null };
    const hasAccess = task.user_id === req.userId! ||
                      (task.household_id && task.household_id === currentUser.household_id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const entries = db.prepare(`
      SELECT * FROM task_time_entries
      WHERE task_id = ?
      ORDER BY started_at DESC
    `).all(taskId) as TaskTimeEntry[];

    res.json({ entries });
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// Get active timer for current user
router.get('/active', (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const activeTimer = db.prepare(`
      SELECT * FROM task_time_entries
      WHERE user_id = ? AND ended_at IS NULL
      LIMIT 1
    `).get(req.userId!) as TaskTimeEntry | undefined;

    res.json({ entry: activeTimer || null });
  } catch (error) {
    console.error('Error fetching active timer:', error);
    res.status(500).json({ error: 'Failed to fetch active timer' });
  }
});

// Start a timer
router.post('/start/:taskId', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const validation = validateRequest(timeEntryStartSchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const db = getDatabase();

  try {
    // Check for existing active timer
    const activeTimer = db.prepare(`
      SELECT tte.*, t.title as task_title
      FROM task_time_entries tte
      JOIN tasks t ON tte.task_id = t.id
      WHERE tte.user_id = ? AND tte.ended_at IS NULL
    `).get(req.userId!) as (TaskTimeEntry & { task_title: string }) | undefined;

    if (activeTimer) {
      return res.status(400).json({
        error: 'You already have an active timer running',
        active_entry_id: activeTimer.id,
        active_task_id: activeTimer.task_id,
        active_task_title: activeTimer.task_title,
      });
    }

    // Verify task access
    const task = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(taskId) as (Task & { creator_household_id: number | null }) | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentUser = db.prepare('SELECT household_id FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null };
    const hasAccess = task.user_id === req.userId! ||
                      (task.household_id && task.household_id === currentUser.household_id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const started_at = validation.data.started_at || new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO task_time_entries (task_id, user_id, started_at, ended_at, duration)
      VALUES (?, ?, ?, NULL, NULL)
    `).run(taskId, req.userId!, started_at);

    const entry = db.prepare('SELECT * FROM task_time_entries WHERE id = ?').get(result.lastInsertRowid) as TaskTimeEntry;

    res.status(201).json({ entry });
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Stop a timer
router.post('/stop/:id', async (req: AuthRequest, res) => {
  const entryId = parseInt(req.params.id);
  const validation = validateRequest(timeEntryStopSchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const db = getDatabase();

  try {
    // Get entry and verify ownership
    const entry = db.prepare('SELECT * FROM task_time_entries WHERE id = ?').get(entryId) as TaskTimeEntry | undefined;

    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    if (entry.user_id !== req.userId!) {
      return res.status(403).json({ error: 'Can only stop your own timer' });
    }

    if (entry.ended_at !== null) {
      return res.status(400).json({ error: 'Timer is not running' });
    }

    const ended_at = validation.data.ended_at || new Date().toISOString();
    const startedAt = new Date(entry.started_at);
    const endedAt = new Date(ended_at);
    const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    if (duration < 0) {
      return res.status(400).json({ error: 'End time cannot be before start time' });
    }

    db.prepare(`
      UPDATE task_time_entries
      SET ended_at = ?, duration = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(ended_at, duration, validation.data.notes || null, entryId);

    const updatedEntry = db.prepare('SELECT * FROM task_time_entries WHERE id = ?').get(entryId) as TaskTimeEntry;

    // Activity log
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(entry.task_id) as Task;
    if (task.household_id) {
      const durationMinutes = Math.round(duration / 60);
      await activityService.createActivity(
        task.household_id,
        req.userId!,
        'time_tracked',
        task.id,
        { task_title: task.title, duration_minutes: durationMinutes }
      );
    }

    res.json({ entry: updatedEntry });
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// Update a time entry
router.put('/:id', (req: AuthRequest, res) => {
  const entryId = parseInt(req.params.id);
  const validation = validateRequest(timeEntryUpdateSchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const db = getDatabase();

  try {
    // Get entry and verify ownership
    const entry = db.prepare('SELECT * FROM task_time_entries WHERE id = ?').get(entryId) as TaskTimeEntry | undefined;

    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    if (entry.user_id !== req.userId!) {
      return res.status(403).json({ error: 'Can only edit your own time entries' });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (validation.data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(validation.data.notes);
    }

    if (validation.data.duration !== undefined) {
      updates.push('duration = ?');
      values.push(validation.data.duration);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(entryId);

    db.prepare(`
      UPDATE task_time_entries
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updatedEntry = db.prepare('SELECT * FROM task_time_entries WHERE id = ?').get(entryId) as TaskTimeEntry;

    res.json({ entry: updatedEntry });
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// Delete a time entry
router.delete('/:id', (req: AuthRequest, res) => {
  const entryId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    // Get entry and verify ownership
    const entry = db.prepare('SELECT * FROM task_time_entries WHERE id = ?').get(entryId) as TaskTimeEntry | undefined;

    if (!entry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    if (entry.user_id !== req.userId!) {
      return res.status(403).json({ error: 'Can only delete your own time entries' });
    }

    db.prepare('DELETE FROM task_time_entries WHERE id = ?').run(entryId);

    res.json({ message: 'Time entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// Get time summary for a task
router.get('/summary/:taskId', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const db = getDatabase();

  try {
    // Verify task access
    const task = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(taskId) as (Task & { creator_household_id: number | null }) | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentUser = db.prepare('SELECT household_id FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null };
    const hasAccess = task.user_id === req.userId! ||
                      (task.household_id && task.household_id === currentUser.household_id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const summary = db.prepare(`
      SELECT
        COALESCE(SUM(duration), 0) as total_duration,
        COUNT(*) as entry_count
      FROM task_time_entries
      WHERE task_id = ? AND ended_at IS NOT NULL
    `).get(taskId) as { total_duration: number; entry_count: number };

    const userBreakdown = db.prepare(`
      SELECT
        tte.user_id,
        u.email as user_email,
        COALESCE(SUM(tte.duration), 0) as duration
      FROM task_time_entries tte
      JOIN users u ON tte.user_id = u.id
      WHERE tte.task_id = ? AND tte.ended_at IS NOT NULL
      GROUP BY tte.user_id
    `).all(taskId) as Array<{ user_id: number; user_email: string; duration: number }>;

    const result: TaskTimeEntrySummary = {
      task_id: taskId,
      total_duration: summary.total_duration,
      entry_count: summary.entry_count,
      user_breakdown: userBreakdown,
    };

    res.json({ summary: result });
  } catch (error) {
    console.error('Error fetching time summary:', error);
    res.status(500).json({ error: 'Failed to fetch time summary' });
  }
});

export default router;
