import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { TaskTemplate } from '../types';

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

    const grouped = templates.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = [];
      }
      acc[template.category].push(template);
      return acc;
    }, {} as Record<string, TaskTemplate[]>);

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

    res.json({ template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

export default router;
