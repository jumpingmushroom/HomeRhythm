export const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  recurrence_type TEXT NOT NULL CHECK(recurrence_type IN ('once', 'daily', 'weekly', 'monthly', 'yearly', 'seasonal')),
  recurrence_interval INTEGER,
  recurrence_config TEXT, -- JSON for complex patterns like weekdays, month dates, etc.
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  estimated_time INTEGER, -- in minutes
  estimated_cost REAL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Task completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  completion_notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Task photos table
CREATE TABLE IF NOT EXISTS task_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  completion_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (completion_id) REFERENCES task_completions(id) ON DELETE CASCADE
);

-- Task templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  suggested_recurrence_type TEXT NOT NULL,
  suggested_recurrence_interval INTEGER,
  suggested_recurrence_config TEXT,
  is_system_template INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON task_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_task_photos_completion_id ON task_photos(completion_id);
`;
