import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, dependencySchema } from '../utils/validation';
import { TaskDependency, DependencyWithTask, Task } from '../types';
import { activityService } from '../services/activity.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Circular dependency detection using BFS
function detectCircularDependency(db: any, taskId: number, dependsOnTaskId: number): boolean {
  const visited = new Set<number>();
  const queue: number[] = [dependsOnTaskId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // If we reached the original task, we found a cycle
    if (current === taskId) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }

    visited.add(current);

    // Get all tasks that the current task depends on
    const dependencies = db.prepare(`
      SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?
    `).all(current) as Array<{ depends_on_task_id: number }>;

    for (const dep of dependencies) {
      queue.push(dep.depends_on_task_id);
    }
  }

  return false;
}

// Get all dependencies for a task
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

    const dependencies = db.prepare(`
      SELECT
        td.*,
        t.title as depends_on_task_title,
        CASE WHEN EXISTS (
          SELECT 1 FROM task_completions WHERE task_id = td.depends_on_task_id
        ) THEN 1 ELSE 0 END as depends_on_task_completed
      FROM task_dependencies td
      JOIN tasks t ON td.depends_on_task_id = t.id
      WHERE td.task_id = ?
    `).all(taskId) as DependencyWithTask[];

    res.json({ dependencies });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
});

// Check blocking dependencies for a task
router.get('/task/:taskId/blocking', (req: AuthRequest, res) => {
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

    // Find all dependencies that are not completed
    const blockingTasks = db.prepare(`
      SELECT
        t.id,
        t.title,
        t.priority
      FROM task_dependencies td
      JOIN tasks t ON td.depends_on_task_id = t.id
      WHERE td.task_id = ?
        AND NOT EXISTS (
          SELECT 1 FROM task_completions WHERE task_id = t.id
        )
    `).all(taskId) as Array<{ id: number; title: string; priority: string }>;

    res.json({
      has_blocking: blockingTasks.length > 0,
      blocking_tasks: blockingTasks,
    });
  } catch (error) {
    console.error('Error checking blocking dependencies:', error);
    res.status(500).json({ error: 'Failed to check blocking dependencies' });
  }
});

// Create a dependency
router.post('/', async (req: AuthRequest, res) => {
  const validation = validateRequest(dependencySchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { task_id, depends_on_task_id } = validation.data;
  const db = getDatabase();

  try {
    // Verify both tasks exist and user has access
    const task = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(task_id) as (Task & { creator_household_id: number | null }) | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const dependsOnTask = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(depends_on_task_id) as (Task & { creator_household_id: number | null }) | undefined;

    if (!dependsOnTask) {
      return res.status(404).json({ error: 'Dependency task not found' });
    }

    const currentUser = db.prepare('SELECT household_id FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null };
    const hasAccessToTask = task.user_id === req.userId! ||
                            (task.household_id && task.household_id === currentUser.household_id);
    const hasAccessToDependency = dependsOnTask.user_id === req.userId! ||
                                  (dependsOnTask.household_id && dependsOnTask.household_id === currentUser.household_id);

    if (!hasAccessToTask || !hasAccessToDependency) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if dependency already exists
    const existing = db.prepare(`
      SELECT id FROM task_dependencies WHERE task_id = ? AND depends_on_task_id = ?
    `).get(task_id, depends_on_task_id);

    if (existing) {
      return res.status(400).json({ error: 'Dependency already exists' });
    }

    // Check for circular dependency
    if (detectCircularDependency(db, task_id, depends_on_task_id)) {
      return res.status(400).json({
        error: 'This dependency would create a circular reference',
      });
    }

    const result = db.prepare(`
      INSERT INTO task_dependencies (task_id, depends_on_task_id)
      VALUES (?, ?)
    `).run(task_id, depends_on_task_id);

    const dependency = db.prepare(`
      SELECT
        td.*,
        t.title as depends_on_task_title,
        CASE WHEN EXISTS (
          SELECT 1 FROM task_completions WHERE task_id = td.depends_on_task_id
        ) THEN 1 ELSE 0 END as depends_on_task_completed
      FROM task_dependencies td
      JOIN tasks t ON td.depends_on_task_id = t.id
      WHERE td.id = ?
    `).get(result.lastInsertRowid) as DependencyWithTask;

    // Activity log
    if (task.household_id) {
      await activityService.createActivity(
        task.household_id,
        req.userId!,
        'dependency_added',
        task.id,
        { task_title: task.title, depends_on_task_title: dependsOnTask.title }
      );
    }

    res.status(201).json({ dependency });
  } catch (error) {
    console.error('Error creating dependency:', error);
    res.status(500).json({ error: 'Failed to create dependency' });
  }
});

// Delete a dependency
router.delete('/:id', (req: AuthRequest, res) => {
  const dependencyId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    // Get dependency and verify task access
    const dependency = db.prepare('SELECT * FROM task_dependencies WHERE id = ?').get(dependencyId) as TaskDependency | undefined;

    if (!dependency) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    const task = db.prepare(`
      SELECT t.*, u.household_id as creator_household_id
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(dependency.task_id) as (Task & { creator_household_id: number | null }) | undefined;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentUser = db.prepare('SELECT household_id FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null };
    const hasAccess = task.user_id === req.userId! ||
                      (task.household_id && task.household_id === currentUser.household_id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    db.prepare('DELETE FROM task_dependencies WHERE id = ?').run(dependencyId);

    res.json({ message: 'Dependency deleted successfully' });
  } catch (error) {
    console.error('Error deleting dependency:', error);
    res.status(500).json({ error: 'Failed to delete dependency' });
  }
});

export default router;
