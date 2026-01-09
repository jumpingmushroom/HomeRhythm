import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, taskSchema, taskSchemaPartial } from '../utils/validation';
import { Task } from '../types';
import { notificationService } from '../services/notification.service';
import { activityService } from '../services/activity.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all tasks for the current user
router.get('/', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { category, priority, search, filter } = req.query;

  try {
    // Get user's household_id
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    // Filter: 'created' = tasks user created, 'assigned' = tasks assigned to user, 'unassigned' = no assignment, default = all household tasks
    let query = 'SELECT * FROM tasks WHERE ';
    const params: any[] = [];

    if (user.household_id) {
      // User has household - show household tasks
      query += 'household_id = ?';
      params.push(user.household_id);

      if (filter === 'created') {
        query += ' AND user_id = ?';
        params.push(req.userId!);
      } else if (filter === 'assigned') {
        query += ' AND assigned_to = ?';
        params.push(req.userId!);
      } else if (filter === 'unassigned') {
        query += ' AND assigned_to IS NULL';
      }
    } else {
      // User without household - only show their own tasks
      query += 'user_id = ? AND household_id IS NULL';
      params.push(req.userId!);
    }

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
    // Get user's household_id
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    let task: Task | undefined;

    if (user.household_id) {
      // User has household - can see household tasks
      task = db.prepare('SELECT * FROM tasks WHERE id = ? AND household_id = ?')
        .get(taskId, user.household_id) as Task | undefined;
    } else {
      // No household - only own tasks
      task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ? AND household_id IS NULL')
        .get(taskId, req.userId!) as Task | undefined;
    }

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
router.post('/', async (req: AuthRequest, res) => {
  const validation = validateRequest(taskSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const data = validation.data;
  const db = getDatabase();

  try {
    // Get user's household_id
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    // If assigning to someone, verify they're in the same household
    if (data.assigned_to && user.household_id) {
      const assignee = db.prepare('SELECT household_id FROM users WHERE id = ?')
        .get(data.assigned_to) as { household_id: number | null } | undefined;

      if (!assignee || assignee.household_id !== user.household_id) {
        return res.status(400).json({ error: 'Can only assign tasks to household members' });
      }
    }

    const result = db.prepare(`
      INSERT INTO tasks (
        user_id, household_id, assigned_to, title, description, category,
        schedule_type, due_date, flexibility_window, recurrence_pattern, recurrence_interval, recurrence_config,
        priority, estimated_time, estimated_cost, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId!,
      user.household_id,
      data.assigned_to || null,
      data.title,
      data.description || null,
      data.category,
      data.schedule_type,
      data.due_date || null,
      data.flexibility_window || null,
      data.recurrence_pattern || null,
      data.recurrence_interval || null,
      data.recurrence_config || null,
      data.priority,
      data.estimated_time || null,
      data.estimated_cost || null,
      data.notes || null
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;

    // Create activity log entry
    if (user.household_id) {
      activityService.createActivity(
        user.household_id,
        req.userId!,
        'task_created',
        task.id,
        {
          task_title: task.title,
          assigned_to: task.assigned_to || undefined,
        }
      );
    }

    // Send notification if task is assigned to someone else
    if (task.assigned_to && task.assigned_to !== req.userId) {
      try {
        await notificationService.sendTaskAssignedNotification(task);
      } catch (error) {
        console.error('Error sending assignment notification:', error);
        // Don't fail the request if notification fails
      }
    }

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update a task
router.put('/:id', async (req: AuthRequest, res) => {
  const validation = validateRequest(taskSchemaPartial, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const taskId = parseInt(req.params.id);
  const data = validation.data;
  const db = getDatabase();

  try {
    // Get user's household_id
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    // Verify task belongs to user and get existing data
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, req.userId!) as Task | undefined;
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // If assigning to someone, verify they're in the same household
    if (data.assigned_to !== undefined && user.household_id) {
      const assignee = db.prepare('SELECT household_id FROM users WHERE id = ?')
        .get(data.assigned_to) as { household_id: number | null } | undefined;

      if (!assignee || assignee.household_id !== user.household_id) {
        return res.status(400).json({ error: 'Can only assign tasks to household members' });
      }
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

    // Create activity log entry
    if (user.household_id) {
      if (data.assigned_to !== undefined && data.assigned_to !== existingTask.assigned_to) {
        // Assignment changed
        activityService.createActivity(
          user.household_id,
          req.userId!,
          'task_assigned',
          task.id,
          {
            task_title: task.title,
            assigned_to: task.assigned_to || undefined,
          }
        );
      } else {
        // General update
        activityService.createActivity(
          user.household_id,
          req.userId!,
          'task_updated',
          task.id,
          {
            task_title: task.title,
          }
        );
      }
    }

    // Check if assigned_to changed and send notification
    if (data.assigned_to !== undefined && data.assigned_to !== existingTask.assigned_to && data.assigned_to !== req.userId) {
      try {
        await notificationService.sendTaskAssignedNotification(task);
      } catch (error) {
        console.error('Error sending assignment notification:', error);
        // Don't fail the request if notification fails
      }
    }

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
    // Get user's household_id and task details before deleting
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(taskId, req.userId!) as Task | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, req.userId!);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Create activity log entry
    if (user.household_id) {
      activityService.createActivity(
        user.household_id,
        req.userId!,
        'task_deleted',
        null, // Task is deleted, so no task_id reference
        {
          task_title: task.title,
        }
      );
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
