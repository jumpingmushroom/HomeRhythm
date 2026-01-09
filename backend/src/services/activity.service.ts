import { getDatabase } from '../database';
import { ActivityMetadata } from '../types';

class ActivityService {
  createActivity(
    householdId: number,
    userId: number,
    activityType: 'task_created' | 'task_completed' | 'task_assigned' | 'task_updated' | 'task_deleted',
    taskId: number | null,
    metadata?: ActivityMetadata
  ) {
    const db = getDatabase();

    try {
      db.prepare(
        `INSERT INTO activities (household_id, user_id, activity_type, task_id, metadata)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        householdId,
        userId,
        activityType,
        taskId,
        metadata ? JSON.stringify(metadata) : null
      );
    } catch (error) {
      console.error('Error creating activity:', error);
      // Don't throw - activities are non-critical
    }
  }
}

export const activityService = new ActivityService();
