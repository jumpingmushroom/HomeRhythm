import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, subtaskSchema, subtaskReorderSchema } from '../utils/validation';
import { TaskSubtask, Task } from '../types';
import { activityService } from '../services/activity.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all subtasks for a task
router.get('/task/:taskId', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const db = getDatabase();

  try {
    // Verify task access (user owns task or is in same household)
    const task = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(taskId) as (Task & { creator_household_id: number | null }) | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const currentUser = db.prepare('SELECT household_id FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null };
    const hasAccess = task.user_id === req.userId! ||
                      (task.household_id && task.household_id === currentUser.household_id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const subtasks = db.prepare(`
      SELECT * FROM task_subtasks
      WHERE task_id = ?
      ORDER BY position ASC
    `).all(taskId) as TaskSubtask[];

    res.json({ subtasks });
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    res.status(500).json({ error: 'Failed to fetch subtasks' });
  }
});

// Create a subtask
router.post('/task/:taskId', async (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const validation = validateRequest(subtaskSchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { text, completed = 0 } = validation.data;
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

    // Get max position
    const maxPosition = db.prepare(`
      SELECT COALESCE(MAX(position), -1) as max_pos FROM task_subtasks WHERE task_id = ?
    `).get(taskId) as { max_pos: number };

    const position = maxPosition.max_pos + 1;

    const result = db.prepare(`
      INSERT INTO task_subtasks (task_id, text, completed, position)
      VALUES (?, ?, ?, ?)
    `).run(taskId, text, completed, position);

    const subtask = db.prepare('SELECT * FROM task_subtasks WHERE id = ?').get(result.lastInsertRowid) as TaskSubtask;

    // Activity log
    if (task.household_id) {
      await activityService.createActivity(
        task.household_id,
        req.userId!,
        'task_updated',
        task.id,
        { task_title: task.title, action: 'Added subtask', subtask_text: text }
      );
    }

    res.status(201).json({ subtask });
  } catch (error) {
    console.error('Error creating subtask:', error);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// Update a subtask
router.put('/:id', async (req: AuthRequest, res) => {
  const subtaskId = parseInt(req.params.id);
  const validation = validateRequest(subtaskSchema.partial(), req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const db = getDatabase();

  try {
    // Get subtask and verify task access
    const subtask = db.prepare('SELECT * FROM task_subtasks WHERE id = ?').get(subtaskId) as TaskSubtask | undefined;

    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const task = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(subtask.task_id) as (Task & { creator_household_id: number | null }) | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentUser = db.prepare('SELECT household_id FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null };
    const hasAccess = task.user_id === req.userId! ||
                      (task.household_id && task.household_id === currentUser.household_id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (validation.data.text !== undefined) {
      updates.push('text = ?');
      values.push(validation.data.text);
    }

    if (validation.data.completed !== undefined) {
      updates.push('completed = ?');
      values.push(validation.data.completed);
    }

    if (validation.data.position !== undefined) {
      updates.push('position = ?');
      values.push(validation.data.position);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    values.push(subtaskId);

    db.prepare(`
      UPDATE task_subtasks
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    const updatedSubtask = db.prepare('SELECT * FROM task_subtasks WHERE id = ?').get(subtaskId) as TaskSubtask;

    // Activity log for completion toggle
    if (validation.data.completed !== undefined && task.household_id) {
      await activityService.createActivity(
        task.household_id,
        req.userId!,
        'subtask_completed',
        task.id,
        { task_title: task.title, subtask_text: subtask.text, completed: validation.data.completed === 1 }
      );
    }

    res.json({ subtask: updatedSubtask });
  } catch (error) {
    console.error('Error updating subtask:', error);
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

// Delete a subtask
router.delete('/:id', (req: AuthRequest, res) => {
  const subtaskId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    // Get subtask and verify task access
    const subtask = db.prepare('SELECT * FROM task_subtasks WHERE id = ?').get(subtaskId) as TaskSubtask | undefined;

    if (!subtask) {
      return res.status(404).json({ error: 'Subtask not found' });
    }

    const task = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(subtask.task_id) as (Task & { creator_household_id: number | null }) | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentUser = db.prepare('SELECT household_id FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null };
    const hasAccess = task.user_id === req.userId! ||
                      (task.household_id && task.household_id === currentUser.household_id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare('DELETE FROM task_subtasks WHERE id = ?').run(subtaskId);

    res.json({ message: 'Subtask deleted successfully' });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

// Reorder subtasks
router.put('/task/:taskId/reorder', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const validation = validateRequest(subtaskReorderSchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { subtasks } = validation.data;
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

    // Update positions in a transaction
    const updatePosition = db.prepare('UPDATE task_subtasks SET position = ?, updated_at = datetime(\'now\') WHERE id = ?');

    const updateAll = db.transaction(() => {
      for (const subtask of subtasks) {
        updatePosition.run(subtask.position, subtask.id);
      }
    });

    updateAll();

    res.json({ message: 'Subtasks reordered successfully' });
  } catch (error) {
    console.error('Error reordering subtasks:', error);
    res.status(500).json({ error: 'Failed to reorder subtasks' });
  }
});

export default router;
