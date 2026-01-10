import { getDatabase, closeDatabase } from './index';
import { schema } from './schema';
import { seedTemplates, seedTemplateSubtasks } from './seed';

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

    // Add new columns if they don't exist
    if (!hasScheduleType) {
      console.log('Adding new scheduling columns...');

      db.exec(`
        ALTER TABLE tasks ADD COLUMN schedule_type TEXT;
        ALTER TABLE tasks ADD COLUMN due_date TEXT;
        ALTER TABLE tasks ADD COLUMN flexibility_window TEXT;
        ALTER TABLE tasks ADD COLUMN recurrence_pattern TEXT;
      `);
    }

    // Migrate data if old recurrence_type column exists and has data
    if (hasOldRecurrenceType) {
      console.log('Migrating data from old recurrence_type column...');

      // Migrate data from old schema to new schema
      // Tasks with recurrence_type='once' become schedule_type='once' with flexibility_window='within_month'
      db.prepare(`
        UPDATE tasks
        SET schedule_type = COALESCE(schedule_type, 'once'),
            flexibility_window = COALESCE(flexibility_window, 'within_month')
        WHERE recurrence_type = 'once'
      `).run();

      // Tasks with other recurrence types become schedule_type='recurring' with matching recurrence_pattern
      db.prepare(`
        UPDATE tasks
        SET schedule_type = COALESCE(schedule_type, 'recurring'),
            recurrence_pattern = COALESCE(recurrence_pattern, recurrence_type)
        WHERE recurrence_type IN ('daily', 'weekly', 'monthly', 'yearly', 'seasonal')
      `).run();

      // Drop the old recurrence_type column (requires SQLite 3.35.0+)
      // For older SQLite versions, we need to recreate the table
      console.log('Removing old recurrence_type column...');
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
    } else {
      console.log('No old recurrence_type column found, migration not needed');
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

      // Migration: Add UNIQUE index on template title
      console.log('Checking for unique index on task_templates.title...');
      const hasUniqueIndex = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_task_templates_title_unique'"
      ).get();
      if (!hasUniqueIndex) {
        console.log('Creating unique index on task_templates.title...');
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_task_templates_title_unique ON task_templates(title)');
        console.log('Unique index created');
      }

      // Migration: Add Norwegian-specific templates
      console.log('Checking for Norwegian-specific templates...');
      const norwegianTemplates = db.prepare("SELECT COUNT(*) as count FROM task_templates WHERE title = 'Winterize cabin'").get() as { count: number };
      if (norwegianTemplates.count === 0) {
        console.log('Adding Norwegian-specific templates...');
        seedTemplates();
        seedTemplateSubtasks();
        console.log('Norwegian templates added');
      }
    }

    // Migration: Add notification preferences table
    console.log('Checking for notification preferences table...');
    const hasNotificationPrefs = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_notification_preferences'"
    ).get();

    if (!hasNotificationPrefs) {
      console.log('Creating notification tables...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_notification_preferences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          notifications_enabled INTEGER DEFAULT 1,
          task_due_soon_days INTEGER DEFAULT 3,
          task_due_soon_enabled INTEGER DEFAULT 1,
          task_overdue_enabled INTEGER DEFAULT 1,
          task_assigned_enabled INTEGER DEFAULT 1,
          digest_enabled INTEGER DEFAULT 0,
          digest_frequency TEXT DEFAULT 'daily' CHECK(digest_frequency IN ('daily', 'weekly')),
          digest_time TEXT DEFAULT '09:00',
          digest_day_of_week INTEGER DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notification_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          task_id INTEGER,
          notification_type TEXT NOT NULL CHECK(notification_type IN ('due_soon', 'overdue', 'assigned', 'digest')),
          reference_date TEXT NOT NULL,
          sent_at TEXT DEFAULT (datetime('now')),
          status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed')),
          error_message TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_notification_logs_dedup
          ON notification_logs(user_id, task_id, notification_type, reference_date);
        CREATE INDEX IF NOT EXISTS idx_notification_logs_user_sent
          ON notification_logs(user_id, sent_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_schedule_type ON tasks(schedule_type);
      `);
      console.log('Notification tables created successfully');
    }

    // Migration: Add household_id to users table
    console.log('Checking for household_id in users table...');
    let usersTableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>;
    const hasUserHouseholdId = usersTableInfo.some(col => col.name === 'household_id');

    if (!hasUserHouseholdId) {
      console.log('Adding household_id to users table...');
      db.exec(`
        ALTER TABLE users ADD COLUMN household_id INTEGER REFERENCES households(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_users_household_id ON users(household_id);
      `);
      console.log('household_id added to users table');
    }

    // Migration: Add household_id to tasks table
    console.log('Checking for household_id in tasks table...');
    let tasksTableInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    const hasTaskHouseholdId = tasksTableInfo.some(col => col.name === 'household_id');

    if (!hasTaskHouseholdId) {
      console.log('Adding household_id to tasks table...');
      db.exec(`
        ALTER TABLE tasks ADD COLUMN household_id INTEGER REFERENCES households(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_tasks_household_id ON tasks(household_id);
      `);
      console.log('household_id added to tasks table');
    }

    // Migration: Create default households for existing users without one
    console.log('Creating default households for existing users...');
    const usersWithoutHousehold = db.prepare(
      'SELECT id, email FROM users WHERE household_id IS NULL'
    ).all() as Array<{ id: number; email: string }>;

    if (usersWithoutHousehold.length > 0) {
      console.log(`Found ${usersWithoutHousehold.length} users without households`);
      const createHousehold = db.prepare(
        'INSERT INTO households (name, owner_id) VALUES (?, ?)'
      );
      const updateUser = db.prepare('UPDATE users SET household_id = ? WHERE id = ?');
      const updateTasks = db.prepare('UPDATE tasks SET household_id = ? WHERE user_id = ?');

      for (const user of usersWithoutHousehold) {
        const householdName = `${user.email.split('@')[0]}'s Home`;
        const result = createHousehold.run(householdName, user.id);
        const householdId = result.lastInsertRowid;
        updateUser.run(householdId, user.id);
        updateTasks.run(householdId, user.id);
        console.log(`Created household ${householdId} for user ${user.id}`);
      }
      console.log('Default households created successfully');
    }

    // Migration: Add task_subtasks table
    console.log('Checking for task_subtasks table...');
    const hasSubtasks = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='task_subtasks'"
    ).get();

    if (!hasSubtasks) {
      console.log('Creating task_subtasks table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS task_subtasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          completed INTEGER DEFAULT 0,
          position INTEGER NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_task_subtasks_task_id ON task_subtasks(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_subtasks_position ON task_subtasks(task_id, position);
      `);
      console.log('task_subtasks table created successfully');
    }

    // Migration: Add task_dependencies table
    console.log('Checking for task_dependencies table...');
    const hasDependencies = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='task_dependencies'"
    ).get();

    if (!hasDependencies) {
      console.log('Creating task_dependencies table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS task_dependencies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          depends_on_task_id INTEGER NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          UNIQUE(task_id, depends_on_task_id),
          CHECK(task_id != depends_on_task_id)
        );

        CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
        CREATE INDEX IF NOT EXISTS idx_task_dependencies_both ON task_dependencies(task_id, depends_on_task_id);
      `);
      console.log('task_dependencies table created successfully');
    }

    // Migration: Add task_time_entries table
    console.log('Checking for task_time_entries table...');
    const hasTimeEntries = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='task_time_entries'"
    ).get();

    if (!hasTimeEntries) {
      console.log('Creating task_time_entries table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS task_time_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          started_at TEXT NOT NULL,
          ended_at TEXT,
          duration INTEGER,
          notes TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_task_time_entries_task_id ON task_time_entries(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_time_entries_user_id ON task_time_entries(user_id);
        CREATE INDEX IF NOT EXISTS idx_task_time_entries_active ON task_time_entries(user_id, ended_at);
        CREATE INDEX IF NOT EXISTS idx_task_time_entries_started_at ON task_time_entries(started_at);
      `);
      console.log('task_time_entries table created successfully');
    }

    // Migration: Add task_comments table
    console.log('Checking for task_comments table...');
    const hasComments = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='task_comments'"
    ).get();

    if (!hasComments) {
      console.log('Creating task_comments table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS task_comments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          comment_text TEXT NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          deleted_at TEXT,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON task_comments(task_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
      `);
      console.log('task_comments table created successfully');
    }

    // Migration: Add template_subtasks table
    console.log('Checking for template_subtasks table...');
    const hasTemplateSubtasks = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='template_subtasks'"
    ).get();

    if (!hasTemplateSubtasks) {
      console.log('Creating template_subtasks table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS template_subtasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          template_id INTEGER NOT NULL,
          text TEXT NOT NULL,
          position INTEGER NOT NULL,
          created_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (template_id) REFERENCES task_templates(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_template_subtasks_template_id ON template_subtasks(template_id);
        CREATE INDEX IF NOT EXISTS idx_template_subtasks_position ON template_subtasks(template_id, position);
      `);
      console.log('template_subtasks table created successfully');
    }

    // Migration: Clean up and reseed template subtasks
    console.log('Checking template subtasks...');
    const subtaskCount = db.prepare('SELECT COUNT(*) as count FROM template_subtasks').get() as { count: number };
    if (subtaskCount.count === 0) {
      console.log('Seeding template subtasks...');
      seedTemplateSubtasks();
    } else {
      // Check for duplicates (more than 10 subtasks for any template is suspicious)
      const duplicateCheck = db.prepare(`
        SELECT template_id, COUNT(*) as count
        FROM template_subtasks
        GROUP BY template_id
        HAVING COUNT(*) > 10
      `).all();

      if (duplicateCheck.length > 0) {
        console.log(`Found duplicate subtasks, cleaning up...`);
        db.prepare('DELETE FROM template_subtasks').run();
        seedTemplateSubtasks();
        console.log('Template subtasks reseeded');
      }
    }

    // Migration: Update activity types
    console.log('Checking activities table for new types...');
    const activitiesTableInfo = db.prepare("PRAGMA table_info(activities)").all() as Array<{ name: string }>;
    const hasActivityType = activitiesTableInfo.some(col => col.name === 'activity_type');

    if (hasActivityType) {
      // Activity types are just strings, no schema change needed
      // But we log that new types will be supported
      console.log('Activity types ready for: subtask_completed, dependency_added, time_tracked, comment_added');
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
