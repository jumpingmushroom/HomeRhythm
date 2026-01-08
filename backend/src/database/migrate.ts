import { getDatabase, closeDatabase } from './index';
import { schema } from './schema';
import { seedTemplates } from './seed';

export function runMigrations() {
  const db = getDatabase();

  try {
    console.log('Running database migrations...');

    // Execute schema
    db.exec(schema);

    console.log('Database schema created successfully');

    // Migration: Add assigned_to column to tasks table if it doesn't exist
    console.log('Checking for assigned_to column...');
    const tableInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    const hasAssignedTo = tableInfo.some(col => col.name === 'assigned_to');

    if (!hasAssignedTo) {
      console.log('Adding assigned_to column to tasks table...');
      db.exec(`
        ALTER TABLE tasks ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
      `);
      console.log('assigned_to column added successfully');
    }

    // Seed templates if table is empty
    const count = db.prepare('SELECT COUNT(*) as count FROM task_templates').get() as { count: number };
    if (count.count === 0) {
      console.log('Seeding task templates...');
      seedTemplates();
    } else {
      // Migration: Update 'garden' category to 'landscaping'
      console.log('Checking for category updates...');
      const gardenCount = db.prepare("SELECT COUNT(*) as count FROM task_templates WHERE category = 'garden'").get() as { count: number };
      if (gardenCount.count > 0) {
        console.log(`Updating ${gardenCount.count} templates from 'garden' to 'landscaping' category...`);
        db.prepare("UPDATE task_templates SET category = 'landscaping' WHERE category = 'garden'").run();
        console.log('Category update completed');
      }
    }

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
  closeDatabase();
}
