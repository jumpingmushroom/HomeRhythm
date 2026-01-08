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
