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
