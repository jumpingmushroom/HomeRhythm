import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, householdSchema, inviteSchema, acceptInviteSchema } from '../utils/validation';
import { Household, HouseholdInvite, User } from '../types';
import crypto from 'crypto';

const router = Router();
router.use(authenticateToken);

// Get current user's household
router.get('/', (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    // Get user's household_id
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null } | undefined;

    if (!user || !user.household_id) {
      return res.json({ household: null, members: [], invites: [] });
    }

    // Get household details
    const household = db.prepare('SELECT * FROM households WHERE id = ?')
      .get(user.household_id) as Household;

    // Get household members
    const members = db.prepare('SELECT id, email, created_at FROM users WHERE household_id = ?')
      .all(user.household_id) as Omit<User, 'password_hash'>[];

    // Get pending invites
    const invites = db.prepare(
      `SELECT id, email, invite_code, status, created_at, expires_at
       FROM household_invites
       WHERE household_id = ? AND status = 'pending' AND expires_at > datetime('now')
       ORDER BY created_at DESC`
    ).all(user.household_id) as HouseholdInvite[];

    res.json({ household, members, invites });
  } catch (error) {
    console.error('Error fetching household:', error);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
});

// Create a new household (user must not have one)
router.post('/', (req: AuthRequest, res) => {
  const validation = validateRequest(householdSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { name } = validation.data;
  const db = getDatabase();

  try {
    // Check if user already has a household
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    if (user.household_id) {
      return res.status(400).json({ error: 'User already belongs to a household' });
    }

    // Create household
    const result = db.prepare('INSERT INTO households (name, owner_id) VALUES (?, ?)')
      .run(name, req.userId!);

    // Update user's household_id
    db.prepare('UPDATE users SET household_id = ? WHERE id = ?')
      .run(result.lastInsertRowid, req.userId!);

    const household = db.prepare('SELECT * FROM households WHERE id = ?')
      .get(result.lastInsertRowid) as Household;

    res.status(201).json({ message: 'Household created successfully', household });
  } catch (error) {
    console.error('Error creating household:', error);
    res.status(500).json({ error: 'Failed to create household' });
  }
});

// Update household name
router.put('/', (req: AuthRequest, res) => {
  const validation = validateRequest(householdSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { name } = validation.data;
  const db = getDatabase();

  try {
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    if (!user.household_id) {
      return res.status(404).json({ error: 'Household not found' });
    }

    // Verify user is owner
    const household = db.prepare('SELECT * FROM households WHERE id = ? AND owner_id = ?')
      .get(user.household_id, req.userId!) as Household | undefined;

    if (!household) {
      return res.status(403).json({ error: 'Only household owner can update household' });
    }

    db.prepare('UPDATE households SET name = ? WHERE id = ?')
      .run(name, user.household_id);

    const updatedHousehold = db.prepare('SELECT * FROM households WHERE id = ?')
      .get(user.household_id) as Household;

    res.json({ message: 'Household updated successfully', household: updatedHousehold });
  } catch (error) {
    console.error('Error updating household:', error);
    res.status(500).json({ error: 'Failed to update household' });
  }
});

// Create invite
router.post('/invites', (req: AuthRequest, res) => {
  const validation = validateRequest(inviteSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { email } = validation.data;
  const db = getDatabase();

  try {
    const user = db.prepare('SELECT household_id, email FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null; email: string };

    if (!user.household_id) {
      return res.status(400).json({ error: 'User must belong to a household to send invites' });
    }

    // Check if user is trying to invite themselves
    if (email.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot invite yourself' });
    }

    // Check if email already in household
    const existingMember = db.prepare('SELECT id FROM users WHERE email = ? AND household_id = ?')
      .get(email, user.household_id);

    if (existingMember) {
      return res.status(400).json({ error: 'User already in household' });
    }

    // Check for existing pending invite
    const existingInvite = db.prepare(
      `SELECT id FROM household_invites
       WHERE household_id = ? AND email = ? AND status = 'pending' AND expires_at > datetime('now')`
    ).get(user.household_id, email);

    if (existingInvite) {
      return res.status(400).json({ error: 'Pending invite already exists for this email' });
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(16).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const result = db.prepare(
      `INSERT INTO household_invites (household_id, email, invite_code, invited_by, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(user.household_id, email, inviteCode, req.userId!, expiresAt.toISOString());

    const invite = db.prepare('SELECT * FROM household_invites WHERE id = ?')
      .get(result.lastInsertRowid) as HouseholdInvite;

    res.status(201).json({
      message: 'Invite created successfully',
      invite,
      inviteLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite/${inviteCode}`
    });
  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// Accept invite
router.post('/invites/accept', (req: AuthRequest, res) => {
  const validation = validateRequest(acceptInviteSchema, req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { invite_code } = validation.data;
  const db = getDatabase();

  try {
    // Get user info
    const user = db.prepare('SELECT household_id, email FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null; email: string };

    if (user.household_id) {
      return res.status(400).json({ error: 'User already belongs to a household. Leave your current household first.' });
    }

    // Find valid invite
    const invite = db.prepare(
      `SELECT * FROM household_invites
       WHERE invite_code = ? AND status = 'pending' AND expires_at > datetime('now')`
    ).get(invite_code) as HouseholdInvite | undefined;

    if (!invite) {
      return res.status(404).json({ error: 'Invalid or expired invite code' });
    }

    // Verify email matches
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ error: 'This invite is for a different email address' });
    }

    // Update invite status
    db.prepare('UPDATE household_invites SET status = ?, accepted_at = datetime(\'now\') WHERE id = ?')
      .run('accepted', invite.id);

    // Add user to household
    db.prepare('UPDATE users SET household_id = ? WHERE id = ?')
      .run(invite.household_id, req.userId!);

    // Update user's tasks to belong to household
    db.prepare('UPDATE tasks SET household_id = ? WHERE user_id = ?')
      .run(invite.household_id, req.userId!);

    const household = db.prepare('SELECT * FROM households WHERE id = ?')
      .get(invite.household_id) as Household;

    res.json({ message: 'Invite accepted successfully', household });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// Delete/cancel invite (owner only)
router.delete('/invites/:id', (req: AuthRequest, res) => {
  const inviteId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    if (!user.household_id) {
      return res.status(404).json({ error: 'Household not found' });
    }

    // Verify user is owner
    const household = db.prepare('SELECT * FROM households WHERE id = ? AND owner_id = ?')
      .get(user.household_id, req.userId!) as Household | undefined;

    if (!household) {
      return res.status(403).json({ error: 'Only household owner can delete invites' });
    }

    const result = db.prepare('DELETE FROM household_invites WHERE id = ? AND household_id = ?')
      .run(inviteId, user.household_id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    res.json({ message: 'Invite deleted successfully' });
  } catch (error) {
    console.error('Error deleting invite:', error);
    res.status(500).json({ error: 'Failed to delete invite' });
  }
});

// Leave household (non-owners only)
router.post('/leave', (req: AuthRequest, res) => {
  const db = getDatabase();

  try {
    const user = db.prepare('SELECT household_id FROM users WHERE id = ?')
      .get(req.userId!) as { household_id: number | null };

    if (!user.household_id) {
      return res.status(400).json({ error: 'User is not in a household' });
    }

    // Check if user is owner
    const household = db.prepare('SELECT * FROM households WHERE id = ? AND owner_id = ?')
      .get(user.household_id, req.userId!) as Household | undefined;

    if (household) {
      return res.status(400).json({ error: 'Household owner cannot leave. Transfer ownership or delete household first.' });
    }

    // Remove user from household
    db.prepare('UPDATE users SET household_id = NULL WHERE id = ?')
      .run(req.userId!);

    // Unassign user from tasks and remove their household_id from created tasks
    db.prepare('UPDATE tasks SET assigned_to = NULL WHERE assigned_to = ?')
      .run(req.userId!);
    db.prepare('UPDATE tasks SET household_id = NULL WHERE user_id = ? AND household_id = ?')
      .run(req.userId!, user.household_id);

    res.json({ message: 'Left household successfully' });
  } catch (error) {
    console.error('Error leaving household:', error);
    res.status(500).json({ error: 'Failed to leave household' });
  }
});

export default router;
