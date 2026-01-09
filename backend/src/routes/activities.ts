import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ActivityWithDetails } from '../types';

const router = Router();
router.use(authenticateToken);

// Get activities for user's household
router.get('/', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { limit = 50 } = req.query;

  try {
    // Get user's household_id
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    if (!user.household_id) {
      return res.json({ activities: [] });
    }

    // Get activities with user and task details
    const activities = db.prepare(`
      SELECT
        a.*,
        u.email as user_email,
        t.title as task_title
      FROM activities a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN tasks t ON a.task_id = t.id
      WHERE a.household_id = ?
      ORDER BY a.created_at DESC
      LIMIT ?
    `).all(user.household_id, parseInt(limit as string)) as ActivityWithDetails[];

    // Parse metadata JSON for each activity
    const activitiesWithParsed = activities.map(activity => ({
      ...activity,
      parsed_metadata: activity.metadata ? JSON.parse(activity.metadata) : null
    }));

    res.json({ activities: activitiesWithParsed });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

export default router;
