import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateRequest, commentSchema } from '../utils/validation';
import { TaskComment, TaskCommentWithUser, Task } from '../types';
import { activityService } from '../services/activity.service';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all comments for a task
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

    const comments = db.prepare(`
      SELECT
        tc.*,
        u.email as user_email
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ? AND tc.deleted_at IS NULL
      ORDER BY tc.created_at ASC
    `).all(taskId) as TaskCommentWithUser[];

    res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create a comment
router.post('/task/:taskId', async (req: AuthRequest, res) => {
  const taskId = parseInt(req.params.taskId);
  const validation = validateRequest(commentSchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { comment_text } = validation.data;
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

    const currentUser = db.prepare('SELECT household_id, email FROM users WHERE id = ?').get(req.userId!) as { household_id: number | null; email: string };
    const hasAccess = task.user_id === req.userId! ||
                      (task.household_id && task.household_id === currentUser.household_id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = db.prepare(`
      INSERT INTO task_comments (task_id, user_id, comment_text)
      VALUES (?, ?, ?)
    `).run(taskId, req.userId!, comment_text);

    const comment = db.prepare(`
      SELECT tc.*, u.email as user_email
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `).get(result.lastInsertRowid) as TaskCommentWithUser;

    // Activity log
    if (task.household_id) {
      await activityService.createActivity(
        task.household_id,
        req.userId!,
        'comment_added',
        task.id,
        { task_title: task.title, comment_preview: comment_text.substring(0, 50) }
      );
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update a comment
router.put('/:id', (req: AuthRequest, res) => {
  const commentId = parseInt(req.params.id);
  const validation = validateRequest(commentSchema, req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error });
  }

  const { comment_text } = validation.data;
  const db = getDatabase();

  try {
    // Get comment and verify ownership
    const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(commentId) as TaskComment | undefined;

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.userId!) {
      return res.status(403).json({ error: 'Can only edit your own comments' });
    }

    if (comment.deleted_at) {
      return res.status(400).json({ error: 'Cannot edit deleted comment' });
    }

    db.prepare(`
      UPDATE task_comments
      SET comment_text = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(comment_text, commentId);

    const updatedComment = db.prepare(`
      SELECT tc.*, u.email as user_email
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `).get(commentId) as TaskCommentWithUser;

    res.json({ comment: updatedComment });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment (soft delete)
router.delete('/:id', (req: AuthRequest, res) => {
  const commentId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    // Get comment and verify ownership
    const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(commentId) as TaskComment | undefined;

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.user_id !== req.userId!) {
      return res.status(403).json({ error: 'Can only delete your own comments' });
    }

    // Soft delete
    db.prepare(`
      UPDATE task_comments
      SET deleted_at = datetime('now')
      WHERE id = ?
    `).run(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
