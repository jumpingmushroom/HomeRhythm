import { Task, User } from '../types';

const baseStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
  .content { padding: 20px; background-color: #f9f9f9; }
  .task { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
  .task.overdue { border-left-color: #f44336; }
  .task.due-soon { border-left-color: #ff9800; }
  .task-title { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
  .task-detail { color: #666; margin: 5px 0; }
  .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
`;

export const emailTemplates = {

  taskDueSoon(task: Task, user: User, daysUntilDue: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Task Due Soon</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>This is a reminder that your task is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}:</p>

            <div class="task due-soon">
              <div class="task-title">${task.title}</div>
              ${task.description ? `<div class="task-detail">${task.description}</div>` : ''}
              <div class="task-detail"><strong>Category:</strong> ${task.category}</div>
              <div class="task-detail"><strong>Priority:</strong> ${task.priority.toUpperCase()}</div>
              ${task.estimated_time ? `<div class="task-detail"><strong>Estimated time:</strong> ${task.estimated_time} minutes</div>` : ''}
            </div>

            <p style="margin-top: 20px;">
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}" class="button">View Task</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from HomeRhythm.</p>
            <p>To manage your notification preferences, log in to your account.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  taskOverdue(task: Task, user: User, daysOverdue: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header" style="background-color: #f44336;">
            <h1>Task Overdue</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p><strong>Your task is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue:</strong></p>

            <div class="task overdue">
              <div class="task-title">${task.title}</div>
              ${task.description ? `<div class="task-detail">${task.description}</div>` : ''}
              <div class="task-detail"><strong>Category:</strong> ${task.category}</div>
              <div class="task-detail"><strong>Priority:</strong> ${task.priority.toUpperCase()}</div>
            </div>

            <p style="margin-top: 20px;">
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}" class="button" style="background-color: #f44336;">View Task</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from HomeRhythm.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  taskAssigned(task: Task, assignedBy: User, assignedTo: User): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Task Assigned</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>${assignedBy.email} has assigned a task to you:</p>

            <div class="task">
              <div class="task-title">${task.title}</div>
              ${task.description ? `<div class="task-detail">${task.description}</div>` : ''}
              <div class="task-detail"><strong>Category:</strong> ${task.category}</div>
              <div class="task-detail"><strong>Priority:</strong> ${task.priority.toUpperCase()}</div>
              <div class="task-detail"><strong>Schedule:</strong> ${task.schedule_type === 'once' ? 'One-time task' : `Recurring ${task.recurrence_pattern}`}</div>
            </div>

            <p style="margin-top: 20px;">
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}" class="button">View Task</a>
            </p>
          </div>
          <div class="footer">
            <p>This is an automated notification from HomeRhythm.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  dailyDigest(user: User, dueSoonTasks: Task[], overdueTasks: Task[]): string {
    const hasTasks = dueSoonTasks.length > 0 || overdueTasks.length > 0;

    return `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Daily Task Digest</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>Here's your daily summary of tasks:</p>

            ${overdueTasks.length > 0 ? `
              <h2 style="color: #f44336;">Overdue Tasks (${overdueTasks.length})</h2>
              ${overdueTasks.map(task => `
                <div class="task overdue">
                  <div class="task-title">${task.title}</div>
                  <div class="task-detail"><strong>Category:</strong> ${task.category}</div>
                  <div class="task-detail"><strong>Priority:</strong> ${task.priority.toUpperCase()}</div>
                </div>
              `).join('')}
            ` : ''}

            ${dueSoonTasks.length > 0 ? `
              <h2 style="color: #ff9800;">Due Soon (${dueSoonTasks.length})</h2>
              ${dueSoonTasks.map(task => `
                <div class="task due-soon">
                  <div class="task-title">${task.title}</div>
                  <div class="task-detail"><strong>Category:</strong> ${task.category}</div>
                  <div class="task-detail"><strong>Priority:</strong> ${task.priority.toUpperCase()}</div>
                </div>
              `).join('')}
            ` : ''}

            ${!hasTasks ? `
              <p style="text-align: center; padding: 40px; color: #666;">
                You're all caught up! No tasks due soon or overdue.
              </p>
            ` : ''}

            <p style="margin-top: 20px; text-align: center;">
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}" class="button">View All Tasks</a>
            </p>
          </div>
          <div class="footer">
            <p>This is your scheduled digest from HomeRhythm.</p>
            <p>To change digest frequency or disable, update your notification preferences.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  weeklyDigest(user: User, dueSoonTasks: Task[], overdueTasks: Task[], completedCount: number): string {
    const hasTasks = dueSoonTasks.length > 0 || overdueTasks.length > 0;

    return `
      <!DOCTYPE html>
      <html>
      <head><style>${baseStyles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Weekly Task Summary</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p>Here's your weekly task summary:</p>

            <div style="background: white; padding: 15px; margin: 20px 0; text-align: center;">
              <h3>This Week's Stats</h3>
              <p style="font-size: 24px; color: #4CAF50; margin: 10px 0;"><strong>${completedCount}</strong> tasks completed</p>
              <p style="color: #666;">Great job!</p>
            </div>

            ${overdueTasks.length > 0 ? `
              <h2 style="color: #f44336;">Overdue Tasks (${overdueTasks.length})</h2>
              ${overdueTasks.map(task => `
                <div class="task overdue">
                  <div class="task-title">${task.title}</div>
                  <div class="task-detail"><strong>Category:</strong> ${task.category}</div>
                </div>
              `).join('')}
            ` : ''}

            ${dueSoonTasks.length > 0 ? `
              <h2 style="color: #ff9800;">Coming Up (${dueSoonTasks.length})</h2>
              ${dueSoonTasks.map(task => `
                <div class="task due-soon">
                  <div class="task-title">${task.title}</div>
                  <div class="task-detail"><strong>Category:</strong> ${task.category}</div>
                </div>
              `).join('')}
            ` : ''}

            <p style="margin-top: 20px; text-align: center;">
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}" class="button">View All Tasks</a>
            </p>
          </div>
          <div class="footer">
            <p>This is your weekly digest from HomeRhythm.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },
};
