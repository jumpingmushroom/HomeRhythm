# HomeRhythm - Seasonal Home Maintenance Tracker

![HomeRhythm](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

HomeRhythm is an open-source web application for tracking recurring home maintenance tasks. It helps homeowners stay on top of seasonal and annual maintenance like gutter cleaning, HVAC servicing, garden prep, and more.

## Features

### Core Functionality
- **Multi-user support** with JWT authentication
- **Task management** - Create, edit, and delete maintenance tasks
- **Flexible recurrence patterns** - Daily, weekly, monthly, yearly, or seasonal
- **Task categories** - Organize by exterior, HVAC, appliances, garden, plumbing, electrical, and more
- **Priority levels** - Low, medium, and high priority tasks
- **Task completion tracking** - Mark tasks as complete with notes and photos
- **Photo uploads** - Document your work with before/after photos
- **Completion history** - View all past completions for each task
- **Task template library** - 30+ pre-populated common home maintenance tasks
- **Search and filtering** - Find tasks by name, category, or priority
- **Responsive design** - Works on mobile, tablet, and desktop

### User Interface
- Clean, modern interface built with Tailwind CSS
- List view with color-coded categories
- Task details modal with full completion history
- Template library browser
- Real-time search and filtering

## Tech Stack

### Backend
- **Node.js** with Express and TypeScript
- **SQLite3** with better-sqlite3 (file-based database)
- **JWT** authentication with bcrypt password hashing
- **Zod** for input validation
- **express-fileupload** for photo uploads

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **Zustand** for state management
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Infrastructure
- **Docker** with docker-compose for easy deployment
- **Multi-stage builds** for optimized production images

## Getting Started

### Prerequisites
- Docker and Docker Compose (recommended)
- OR Node.js 20+ and npm (for local development)

### Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/homeRhythm.git
   cd homeRhythm
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` and set your JWT secret**
   ```env
   JWT_SECRET=your-secure-random-secret-key-here
   ```

4. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   Open your browser to `http://localhost:3000`

6. **Create an account and start tracking!**

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm run install:all
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend on `http://localhost:3000`
   - Frontend on `http://localhost:5173`

4. **Access the application**
   Open your browser to `http://localhost:5173`

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Start the production server
npm start
```

## Project Structure

```
homeRhythm/
├── backend/                 # Express backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── database/       # Database setup and migrations
│   │   ├── middleware/     # Express middleware (auth)
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Main entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── lib/           # API client and utilities
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── data/                  # SQLite database (created on first run)
├── uploads/               # Photo uploads (created on first run)
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
└── README.md
```

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Task Endpoints

#### Get All Tasks
```http
GET /api/tasks?category=hvac&priority=high&search=filter
Authorization: Bearer <token>
```

#### Get Single Task
```http
GET /api/tasks/:id
Authorization: Bearer <token>
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Clean gutters",
  "description": "Remove leaves and debris",
  "category": "exterior",
  "recurrence_type": "yearly",
  "recurrence_interval": 2,
  "recurrence_config": "{\"seasons\": [\"spring\", \"fall\"]}",
  "priority": "high",
  "estimated_time": 120,
  "estimated_cost": 50,
  "notes": "Use ladder safety equipment"
}
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "priority": "medium"
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <token>
```

### Completion Endpoints

#### Get Task Completions
```http
GET /api/completions/task/:taskId
Authorization: Bearer <token>
```

#### Get Last Completion
```http
GET /api/completions/task/:taskId/last
Authorization: Bearer <token>
```

#### Create Completion
```http
POST /api/completions/task/:taskId
Authorization: Bearer <token>
Content-Type: application/json

{
  "completed_at": "2024-03-15T10:30:00Z",
  "completion_notes": "Everything looks good"
}
```

### Photo Endpoints

#### Upload Photos
```http
POST /api/photos/completion/:completionId
Authorization: Bearer <token>
Content-Type: multipart/form-data

photos: [file1, file2, ...]
```

#### Get Photo
```http
GET /api/photos/:id
Authorization: Bearer <token>
```

#### Delete Photo
```http
DELETE /api/photos/:id
Authorization: Bearer <token>
```

### Template Endpoints

#### Get All Templates
```http
GET /api/templates?category=hvac
Authorization: Bearer <token>
```

#### Get Templates by Category
```http
GET /api/templates/by-category
Authorization: Bearer <token>
```

## Database Schema

### Users
- `id` - Primary key
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `created_at` - Timestamp

### Tasks
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Task name
- `description` - Detailed description
- `category` - Task category
- `recurrence_type` - once, daily, weekly, monthly, yearly, seasonal
- `recurrence_interval` - How often (e.g., every 3 months)
- `recurrence_config` - JSON config for complex patterns
- `priority` - low, medium, high
- `estimated_time` - Minutes
- `estimated_cost` - Dollars
- `notes` - Additional notes
- `created_at`, `updated_at` - Timestamps

### Task Completions
- `id` - Primary key
- `task_id` - Foreign key to tasks
- `completed_at` - Completion timestamp
- `completion_notes` - Notes about the completion
- `created_at` - Timestamp

### Task Photos
- `id` - Primary key
- `completion_id` - Foreign key to task_completions
- `file_path` - Path to photo file
- `created_at` - Timestamp

### Task Templates
- `id` - Primary key
- `title` - Template name
- `description` - Template description
- `category` - Task category
- `suggested_recurrence_type` - Suggested recurrence
- `suggested_recurrence_interval` - Suggested interval
- `suggested_recurrence_config` - Suggested config
- `is_system_template` - System vs user template
- `created_at` - Timestamp

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_PATH=./data/homeRhythm.db

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Docker Volumes

The docker-compose configuration creates two volumes:
- `./data` - SQLite database file
- `./uploads` - Uploaded photos

These directories are gitignored and persist across container restarts.

## Security Best Practices

- **Change the JWT secret** in production to a secure random string
- **Use HTTPS** in production (configure a reverse proxy like nginx)
- **Regular backups** of the `data` directory
- **File upload limits** are enforced (10MB default)
- **SQL injection protection** via parameterized queries
- **Password hashing** with bcrypt (10 rounds)
- **JWT expiration** (7 days default)

## Development

### Running Tests
```bash
# Backend tests (to be implemented)
cd backend
npm test

# Frontend tests (to be implemented)
cd frontend
npm test
```

### Code Formatting
```bash
# Format code with prettier (to be implemented)
npm run format
```

### Database Migrations

Migrations run automatically on server start. To run manually:
```bash
cd backend
npm run migrate
```

## Deployment

### Docker Deployment (Recommended)

1. Clone the repository on your server
2. Set up your `.env` file with production values
3. Run `docker-compose up -d`
4. Set up a reverse proxy (nginx/Caddy) with SSL

### Manual Deployment

1. Build the project: `npm run build`
2. Set up a process manager (PM2, systemd)
3. Configure nginx as a reverse proxy
4. Set up SSL with Let's Encrypt

## Roadmap

Future features under consideration:
- Dark mode
- Email/push notifications for upcoming tasks
- Data export (JSON/CSV)
- Task dependencies
- Recurring task scheduling with calendar integration
- Mobile apps (React Native)
- Shared household accounts
- Task assignment to household members
- Weather-based task scheduling
- Cost tracking and budgeting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Report bugs or request features via [GitHub Issues](https://github.com/yourusername/homeRhythm/issues)
- For questions, start a [GitHub Discussion](https://github.com/yourusername/homeRhythm/discussions)

## Acknowledgments

- Built with modern web technologies
- Inspired by the need for better home maintenance tracking
- Icons by [Lucide](https://lucide.dev/)

---

Made with ❤️ for homeowners everywhere
