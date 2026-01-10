import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, templateGenerateSchema } from '../utils/validation';
import { TaskTemplate, Task, TemplateSubtask, TaskTemplateWithSubtasks } from '../types';
import { activityService } from '../services/activity.service';
import { notificationService } from '../services/notification.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all task templates
router.get('/', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { category } = req.query;

  let query = 'SELECT * FROM task_templates WHERE 1=1';
  const params: any[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY category, title';

  try {
    const templates = db.prepare(query).all(...params) as TaskTemplate[];
    res.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get templates grouped by category
router.get('/by-category', (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const templates = db.prepare('SELECT * FROM task_templates ORDER BY category, title').all() as TaskTemplate[];

    // Fetch subtasks for all templates
    const allSubtasks = db.prepare(`
      SELECT * FROM template_subtasks ORDER BY template_id, position
    `).all() as TemplateSubtask[];

    // Group subtasks by template_id
    const subtasksByTemplate = allSubtasks.reduce((acc, subtask) => {
      if (!acc[subtask.template_id]) {
        acc[subtask.template_id] = [];
      }
      acc[subtask.template_id].push(subtask);
      return acc;
    }, {} as Record<number, TemplateSubtask[]>);

    // Add subtasks to each template
    const templatesWithSubtasks: TaskTemplateWithSubtasks[] = templates.map(template => ({
      ...template,
      subtasks: subtasksByTemplate[template.id] || [],
    }));

    const grouped = templatesWithSubtasks.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, TaskTemplateWithSubtasks[]>);

    res.json({ templates: grouped });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get a specific template
router.get('/:id', (req: AuthRequest, res) => {
  const templateId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(templateId) as TaskTemplate | undefined;

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Fetch subtasks for this template
    const subtasks = db.prepare(`
      SELECT * FROM template_subtasks WHERE template_id = ? ORDER BY position
    `).all(templateId) as TemplateSubtask[];

    const templateWithSubtasks: TaskTemplateWithSubtasks = {
      ...template,
      subtasks,
    };

    res.json({ template: templateWithSubtasks });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Generate a task from a template
router.post('/:id/generate', async (req: AuthRequest, res) => {
  const templateId = parseInt(req.params.id);
  const validation = validateRequest(templateGenerateSchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { due_date, assigned_to } = validation.data;
  const db = getDatabase();

  try {
    // Get the template
    const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(templateId) as TaskTemplate | undefined;

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get user's household_id
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    // If assigning to someone, verify they're in the same household
    if (assigned_to && user.household_id) {
      const assignee = db.prepare('SELECT household_id FROM users WHERE id = ?')
        .get(assigned_to) as { household_id: number | null } | undefined;

      if (!assignee || assignee.household_id !== user.household_id) {
        return res.status(400).json({ error: 'Can only assign tasks to household members' });
      }
    }

    // Determine schedule type based on template
    const schedule_type = template.suggested_recurrence_pattern ? 'recurring' : 'once';
    const recurrence_pattern = template.suggested_recurrence_pattern || null;
    const recurrence_interval = template.suggested_recurrence_interval || null;
    const recurrence_config = template.suggested_recurrence_config || null;

    // Create task from template
    const result = db.prepare(`
      INSERT INTO tasks (
        user_id, household_id, assigned_to, title, description, category,
        schedule_type, due_date, flexibility_window, recurrence_pattern, recurrence_interval, recurrence_config,
        priority, estimated_time, estimated_cost, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId!,
      user.household_id,
      assigned_to || null,
      template.title,
      template.description || null,
      template.category,
      schedule_type,
      due_date || null,
      null, // flexibility_window - not in template
      recurrence_pattern,
      recurrence_interval,
      recurrence_config,
      'medium', // default priority
      null, // estimated_time - not in template
      null, // estimated_cost - not in template
      null  // notes - not in template
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;

    // Copy template subtasks to the new task
    const templateSubtasks = db.prepare(`
      SELECT text, position FROM template_subtasks
      WHERE template_id = ?
      ORDER BY position ASC
    `).all(templateId) as Array<{ text: string; position: number }>;

    if (templateSubtasks.length > 0) {
      const insertSubtask = db.prepare(`
        INSERT INTO task_subtasks (task_id, text, completed, position)
        VALUES (?, ?, 0, ?)
      `);

      for (const subtask of templateSubtasks) {
        insertSubtask.run(task.id, subtask.text, subtask.position);
      }
    }

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

    res.status(201).json({ message: 'Task created from template', task });
  } catch (error) {
    console.error('Error generating task from template:', error);
    res.status(500).json({ error: 'Failed to generate task from template' });
  }
});

export default router;
