import { Router } from 'express';
import { getDatabase } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { config } from '../config';
import path from 'path';
import fs from 'fs';
import { UploadedFile } from 'express-fileupload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Upload photos for a completion
router.post('/completion/:completionId', async (req: AuthRequest, res) => {
  const completionId = parseInt(req.params.completionId);
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

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No files were uploaded' });
    }

    // Ensure upload directory exists
    if (!fs.existsSync(config.upload.dir)) {
      fs.mkdirSync(config.upload.dir, { recursive: true });
    }

    const uploadedPhotos: any[] = [];
    const files = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];

    for (const file of files) {
      const uploadedFile = file as UploadedFile;

      // Validate file size
      if (uploadedFile.size > config.upload.maxFileSize) {
        return res.status(400).json({ error: `File ${uploadedFile.name} exceeds maximum size` });
      }

      // Validate file type (images only)
      if (!uploadedFile.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: `File ${uploadedFile.name} is not an image` });
      }

      // Generate unique filename
      const ext = path.extname(uploadedFile.name);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const filepath = path.join(config.upload.dir, filename);

      // Move file to upload directory
      await uploadedFile.mv(filepath);

      // Save to database
      const result = db.prepare(`
        INSERT INTO task_photos (completion_id, file_path)
        VALUES (?, ?)
      `).run(completionId, filename);

      uploadedPhotos.push({
        id: result.lastInsertRowid,
        completion_id: completionId,
        file_path: filename,
      });
    }

    res.status(201).json({ message: 'Photos uploaded successfully', photos: uploadedPhotos });
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos' });
  }
});

// Get a specific photo
router.get('/:id', (req: AuthRequest, res) => {
  const photoId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    // Verify photo belongs to user's task completion
    const photo = db.prepare(`
      SELECT tp.* FROM task_photos tp
      JOIN task_completions tc ON tp.completion_id = tc.id
      JOIN tasks t ON tc.task_id = t.id
      WHERE tp.id = ? AND t.user_id = ?
    `).get(photoId, req.userId!);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const filepath = path.join(config.upload.dir, (photo as any).file_path);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Photo file not found' });
    }

    res.sendFile(filepath);
  } catch (error) {
    console.error('Error retrieving photo:', error);
    res.status(500).json({ error: 'Failed to retrieve photo' });
  }
});

// Delete a photo
router.delete('/:id', (req: AuthRequest, res) => {
  const photoId = parseInt(req.params.id);
  const db = getDatabase();

  try {
    // Verify photo belongs to user's task completion
    const photo = db.prepare(`
      SELECT tp.* FROM task_photos tp
      JOIN task_completions tc ON tp.completion_id = tc.id
      JOIN tasks t ON tc.task_id = t.id
      WHERE tp.id = ? AND t.user_id = ?
    `).get(photoId, req.userId!);

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete file from filesystem
    const filepath = path.join(config.upload.dir, (photo as any).file_path);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from database
    db.prepare('DELETE FROM task_photos WHERE id = ?').run(photoId);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
