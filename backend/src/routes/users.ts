import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all users (for assignment dropdown)
router.get('/', (req: AuthRequest, res) => {
  const db = getDatabase();
  const { search } = req.query;

  try {
    // Get user's household_id
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    let query = 'SELECT id, email, created_at FROM users WHERE ';
    const params: any[] = [];

    if (user.household_id) {
      // Show only household members
      query += 'household_id = ?';
      params.push(user.household_id);
    } else {
      // Show only current user if no household
      query += 'id = ?';
      params.push(req.userId!);
    }

    if (search) {
      query += ' AND email LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY email ASC LIMIT 50';

    const users = db.prepare(query).all(...params);
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get a specific user by ID
router.get('/:id', (req: AuthRequest, res) => {
  const db = getDatabase();
  const userId = parseInt(req.params.id);

  try {
    const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
