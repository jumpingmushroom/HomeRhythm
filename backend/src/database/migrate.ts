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
    let tableInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    const hasAssignedTo = tableInfo.some(col => col.name === 'assigned_to');

    if (!hasAssignedTo) {
      console.log('Adding assigned_to column to tasks table...');
      db.exec(`
        ALTER TABLE tasks ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
      `);
      console.log('assigned_to column added successfully');
    }

    // Migration: Update task scheduling schema (recurrence_type -> schedule_type + recurrence_pattern)
    console.log('Checking for new scheduling columns...');
    tableInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    const hasScheduleType = tableInfo.some(col => col.name === 'schedule_type');
    const hasOldRecurrenceType = tableInfo.some(col => col.name === 'recurrence_type');

    if (!hasScheduleType && hasOldRecurrenceType) {
      console.log('Migrating to new scheduling schema...');

      // Add new columns
      db.exec(`
        ALTER TABLE tasks ADD COLUMN schedule_type TEXT;
        ALTER TABLE tasks ADD COLUMN due_date TEXT;
        ALTER TABLE tasks ADD COLUMN flexibility_window TEXT;
        ALTER TABLE tasks ADD COLUMN recurrence_pattern TEXT;
      `);

      // Migrate data from old schema to new schema
      // Tasks with recurrence_type='once' become schedule_type='once' with flexibility_window='within_month'
      db.prepare(`
        UPDATE tasks
        SET schedule_type = 'once',
            flexibility_window = 'within_month'
        WHERE recurrence_type = 'once'
      `).run();

      // Tasks with other recurrence types become schedule_type='recurring' with matching recurrence_pattern
      db.prepare(`
        UPDATE tasks
        SET schedule_type = 'recurring',
            recurrence_pattern = recurrence_type
        WHERE recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly', 'seasonal')
      `).run();

      // Drop the old recurrence_type column (requires SQLite 3.35.0+)
      // For older SQLite versions, we need to recreate the table
      try {
        db.exec(`ALTER TABLE tasks DROP COLUMN recurrence_type;`);
        console.log('Old recurrence_type column dropped successfully');
      } catch (error: any) {
        if (error.message.includes('DROP COLUMN')) {
          // SQLite version doesn't support DROP COLUMN, recreate table instead
          console.log('SQLite version does not support DROP COLUMN, recreating table...');

          db.exec(`
            -- Create new table with correct schema
            CREATE TABLE tasks_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              assigned_to INTEGER,
              title TEXT NOT NULL,
              description TEXT,
              category TEXT NOT NULL,
              schedule_type TEXT NOT NULL CHECK(schedule_type IN ('once', 'recurring')),
              due_date TEXT,
              flexibility_window TEXT CHECK(flexibility_window IN ('exact_date', 'within_week', 'within_month', 'within_year')),
              recurrence_pattern TEXT CHECK(recurrence_pattern IN ('daily', 'weekly', 'monthly', 'yearly', 'seasonal')),
              recurrence_interval INTEGER,
              recurrence_config TEXT,
              priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
              estimated_time INTEGER,
              estimated_cost REAL,
              notes TEXT,
              created_at TEXT DEFAULT (datetime('now')),
              updated_at TEXT DEFAULT (datetime('now')),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
            );

            -- Copy data from old table to new table
            INSERT INTO tasks_new (id, user_id, assigned_to, title, description, category, schedule_type, due_date,
                                   flexibility_window, recurrence_pattern, recurrence_interval, recurrence_config,
                                   priority, estimated_time, estimated_cost, notes, created_at, updated_at)
            SELECT id, user_id, assigned_to, title, description, category, schedule_type, due_date,
                   flexibility_window, recurrence_pattern, recurrence_interval, recurrence_config,
                   priority, estimated_time, estimated_cost, notes, created_at, updated_at
            FROM tasks;

            -- Drop old table
            DROP TABLE tasks;

            -- Rename new table
            ALTER TABLE tasks_new RENAME TO tasks;

            -- Recreate indexes
            CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
            CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
            CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
          `);
          console.log('Table recreated successfully without recurrence_type column');
        } else {
          throw error;
        }
      }

      console.log('Scheduling schema migration completed successfully');
    }

    // Migration: Update task_templates table to use recurrence_pattern
    console.log('Checking task_templates for new scheduling columns...');
    const templateTableInfo = db.prepare("PRAGMA table_info(task_templates)").all() as Array<{ name: string }>;
    const hasOldTemplateRecurrence = templateTableInfo.some(col => col.name === 'suggested_recurrence_type');
    const hasNewTemplateRecurrence = templateTableInfo.some(col => col.name === 'suggested_recurrence_pattern');

    if (hasOldTemplateRecurrence && !hasNewTemplateRecurrence) {
      console.log('Migrating task_templates to new scheduling schema...');

      db.exec(`
        ALTER TABLE task_templates ADD COLUMN suggested_recurrence_pattern TEXT;
      `);

      // Copy data from old column to new
      db.prepare(`
        UPDATE task_templates
        SET suggested_recurrence_pattern = suggested_recurrence_type
      `).run();

      console.log('task_templates migration completed successfully');
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
