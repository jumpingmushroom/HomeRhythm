import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, taskSchema } from '../utils/validation';
import { Task } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all tasks for the current user
router.get('/', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { category, priority, search } = req.query;

  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params: any[] = [req.userId!];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }

  if (search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR notes LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY created_at DESC';

  try {
    const tasks = db.prepare(query).all(...params) as Task[];
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get a specific task
router.get('/:id', (req: AuthRequest, res) => {
  const db = getDatabase();
  const taskId = parseInt(req.params.id);

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.userId!) as Task | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create a new task
router.post('/', (req: AuthRequest, res) => {
  const validation = validateRequest(taskSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const data = validation.data;
  const db = getDatabase();

  try {
    const result = db.prepare(`
      INSERT INTO tasks (
        user_id, title, description, category,
        recurrence_type, recurrence_interval, recurrence_config,
        priority, estimated_time, estimated_cost, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId!,
      data.title,
      data.description || null,
      data.category,
      data.recurrence_type,
      data.recurrence_interval || null,
      data.recurrence_config || null,
      data.priority,
      data.estimated_time || null,
      data.estimated_cost || null,
      data.notes || null
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;
    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/:id', (req: AuthRequest, res) => {
  const validation = validateRequest(taskSchema.partial(), req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const taskId = parseInt(req.params.id);
  const data = validation.data;
  const db = getDatabase();

  try {
    // Verify task belongs to user
    const existingTask = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.userId!);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      updates.push(`${key} = ?`);
      params.push(value);
    });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = datetime(\'now\')');
    params.push(taskId, req.userId!);

    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete a task
router.delete('/:id', (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, req.userId!);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
