import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, completionSchema } from '../utils/validation';
import { TaskCompletion, TaskPhoto } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get completions for a task
router.get('/task/:taskId', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const db = getDatabase();

  try {
    // Verify task belongs to user
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.userId!);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const completions = db.prepare(`
      SELECT tc.*,
        (SELECT json_group_array(json_object('id', tp.id, 'file_path', tp.file_path, 'created_at', tp.created_at))
         FROM task_photos tp WHERE tp.completion_id = tc.id) as photos
      FROM task_completions tc
      WHERE tc.task_id = ?
      ORDER BY tc.completed_at DESC
    `).all(taskId) as any[];

    // Parse photos JSON
    const completionsWithPhotos = completions.map(c => ({
      ...c,
      photos: c.photos ? JSON.parse(c.photos) : [],
    }));

    res.json({ completions: completionsWithPhotos });
  } catch (error) {
    console.error('Error fetching completions:', error);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

// Get last completion for a task
router.get('/task/:taskId/last', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const db = getDatabase();

  try {
    // Verify task belongs to user
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.userId!);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const completion = db.prepare(`
      SELECT * FROM task_completions
      WHERE task_id = ?
      ORDER BY completed_at DESC
      LIMIT 1
    `).get(taskId) as TaskCompletion | undefined;

    if (!completion) {
      return res.status(404).json({ error: 'No completions found' });
    }

    const photos = db.prepare('SELECT * FROM task_photos WHERE completion_id = ?').all(completion.id) as TaskPhoto[];

    res.json({ completion: { ...completion, photos } });
  } catch (error) {
    console.error('Error fetching last completion:', error);
    res.status(500).json({ error: 'Failed to fetch last completion' });
  }
});

// Create a completion for a task
router.post('/task/:taskId', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const validation = validateRequest(completionSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { completed_at, completion_notes } = validation.data;
  const db = getDatabase();

  try {
    // Verify task belongs to user
    const task = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.userId!);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = db.prepare(`
      INSERT INTO task_completions (task_id, completed_at, completion_notes)
      VALUES (?, ?, ?)
    `).run(taskId, completed_at, completion_notes || null);

    const completion = db.prepare('SELECT * FROM task_completions WHERE id = ?').get(result.lastInsertRowid) as TaskCompletion;

    res.status(201).json({ message: 'Task marked as completed', completion });
  } catch (error) {
    console.error('Error creating completion:', error);
    res.status(500).json({ error: 'Failed to create completion' });
  }
});

// Update a completion
router.put('/:id', (req: AuthRequest, res) => {
  const completionId = parseInt(req.params.id);
  const validation = validateRequest(completionSchema.partial(), req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const data = validation.data;
  const db = getDatabase();

  try {
    // Verify completion belongs to user's task
    const completion = db.prepare(`
      SELECT tc.* FROM task_completions tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE tc.id = ? AND t.user_id = ?
    `).get(completionId, req.userId!);

    if (!completion) {
      return res.status(404).json({ error: 'Completion not found' });
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      updates.push(`${key} = ?`);
      params.push(value);
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(completionId);
    db.prepare(`UPDATE task_completions SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updatedCompletion = db.prepare('SELECT * FROM task_completions WHERE id = ?').get(completionId) as TaskCompletion;
    res.json({ message: 'Completion updated successfully', completion: updatedCompletion });
  } catch (error) {
    console.error('Error updating completion:', error);
    res.status(500).json({ error: 'Failed to update completion' });
  }
});

// Delete a completion
router.delete('/:id', (req: AuthRequest, res) => {
  const completionId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    // Verify completion belongs to user's task
    const completion = db.prepare(`
      SELECT tc.* FROM task_completions tc
      JOIN tasks t ON tc.task_id = t.id
      WHERE tc.id = ? AND t.user_id = ?
    `).get(completionId, req.userId!);

    if (!completion) {
      return res.status(404).json({ error: 'Completion not found' });
    }

    db.prepare('DELETE FROM task_completions WHERE id = ?').run(completionId);
    res.json({ message: 'Completion deleted successfully' });
  } catch (error) {
    console.error('Error deleting completion:', error);
    res.status(500).json({ error: 'Failed to delete completion' });
  }
});

export default router;
