# 🚀 Productivity Hub

> **One workspace for your tasks, habits, projects, calendar, and productivity analytics.**

Productivity Hub is a modern full-stack personal productivity platform designed to help you **plan, organize, track, and improve your daily workflow** from a single dashboard.

Built with **Next.js, TypeScript, PostgreSQL, Supabase, and Better Auth**, it combines task management, habit tracking, project organization, calendar scheduling, notifications, and productivity analytics into one application.

---

## ✨ Features

### ✅ Task Management

* Create, edit, complete, and delete tasks
* List and Kanban board views
* Priority levels: Urgent, High, Medium, Low
* Due dates and recurring tasks
* Favorites
* Drag-and-drop ordering
* Full-text task search
* Subtasks and tags
* Inbox for quick task capture

### 📁 Project Management

* Organize tasks into projects
* Active, completed, and archived projects
* Automatic project progress calculation
* Custom project colors
* Project-based task organization

### 🔥 Habit Tracking

* Daily, weekly, monthly, and custom schedules
* Habit streak tracking
* Habit categories
* Daily habit logs
* Optional values such as:

  * Minutes
  * Counts
  * Notes

### 📅 Calendar

Unified calendar containing:

* Tasks
* Habits
* Calendar events
* Upcoming deadlines

### 📊 Analytics

Track your productivity through:

* Task completion trends
* Habit streaks
* Productivity statistics
* Activity history

### 🔔 Notifications

Supports:

* In-app notifications
* Browser push notifications
* Optional email notifications using Resend
* Configurable notification preferences

### 🔐 Authentication & Security

* Email/password authentication
* Signup and login
* Forgot/reset password
* Session-based authentication
* Protected application routes
* Cross-user ownership checks
* PostgreSQL Row Level Security
* Rate limiting
* Secure API endpoints

---

## 🛠️ Tech Stack

| Layer             | Technology            |
| ----------------- | --------------------- |
| Framework         | Next.js 16            |
| Frontend          | React 19              |
| Language          | TypeScript            |
| Styling           | Tailwind CSS v4       |
| UI                | Radix UI              |
| Animations        | Framer Motion         |
| Database          | PostgreSQL            |
| Database Platform | Supabase              |
| Authentication    | Better Auth           |
| Validation        | Zod                   |
| Notifications     | Browser Push + Resend |
| Testing           | Vitest                |
| Deployment        | Vercel                |
| CI/CD             | GitHub Actions        |

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────┐
│          Productivity Hub           │
├─────────────────────────────────────┤
│                                     │
│          Next.js App Router         │
│                                     │
│  ┌──────────┐     ┌─────────────┐  │
│  │   UI     │────▶│ API Routes  │  │
│  │ React 19 │     │ REST APIs   │  │
│  └──────────┘     └──────┬──────┘  │
│                          │         │
│                          ▼         │
│                   ┌─────────────┐  │
│                   │ Better Auth │  │
│                   └──────┬──────┘  │
│                          │         │
│                          ▼         │
│                   ┌─────────────┐  │
│                   │ PostgreSQL  │  │
│                   │  Supabase   │  │
│                   └─────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## 📂 Project Structure

```text
productivity-hub/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
│
├── public/
│
├── scripts/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── app/
│   │   └── auth/
│   │
│   ├── components/
│   │
│   ├── hooks/
│   │
│   ├── lib/
│   │
│   └── proxy.ts
│
├── supabase/
│   ├── schema.sql
│   ├── rls.sql
│   ├── seed.sql
│   └── better-auth-migration.sql
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have:

* **Node.js 20+**
* **npm**
* **Supabase/PostgreSQL database**

### 1. Clone the repository

```bash
git clone https://github.com/mageshsaran805-hue/productivity-hub.git
cd productivity-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Supabase

Create a Supabase project and run the SQL files from the `supabase/` directory in this order:

```text
schema.sql
rls.sql
seed.sql
better-auth-migration.sql
```

### 4. Configure environment variables

Create your local environment file:

```bash
cp .env.example .env.local
```

Configure:

```env
DATABASE_URL=your_postgresql_connection_string

BETTER_AUTH_SECRET=your_secret_key

BETTER_AUTH_URL=http://localhost:3000

RESEND_API_KEY=your_resend_api_key
```

Generate a secure Better Auth secret with:

```bash
openssl rand -base64 32
```

> `RESEND_API_KEY` is optional unless you want email-based password reset functionality.

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Available Scripts

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Create production build  |
| `npm start`     | Start production server  |
| `npm run lint`  | Run ESLint               |
| `npm test`      | Run Vitest tests         |

---

## 🔒 Security

Productivity Hub is designed with security in mind.

Security mechanisms include:

* Protected authenticated routes
* Session-based API authorization
* Cross-user data isolation
* PostgreSQL Row Level Security
* Zod request validation
* Rate limiting
* Secure authentication flows
* Soft deletion
* Database-level ownership policies

The database currently contains **16 tables** covering workspaces, projects, tasks, subtasks, tags, habits, habit logs, calendar events, notifications, activity logs, and user settings.

---

## ☁️ Deployment

The recommended deployment setup is:

```text
GitHub
   │
   ▼
Vercel
   │
   ▼
Next.js Application
   │
   ▼
Supabase PostgreSQL
```

### Deploy with Vercel

1. Import the GitHub repository into Vercel.
2. Configure the required environment variables.
3. Set `BETTER_AUTH_URL` to your production domain.
4. Deploy.

The project also includes GitHub Actions workflows for CI/CD. CI can run type checking, linting, tests, and builds, while CD can deploy the application to Vercel.

---

## 🗄️ Database

The application uses **PostgreSQL through Supabase**.

Major data areas include:

```text
Users
 │
 └── Workspaces
      │
      ├── Projects
      │    └── Tasks
      │         ├── Subtasks
      │         └── Tags
      │
      ├── Habits
      │    └── Habit Logs
      │
      ├── Calendar Events
      │
      ├── Notifications
      │
      ├── Activity Logs
      │
      └── User Settings
```

Row Level Security policies ensure users can only access data they are authorized to access.

---

## 🧩 Core Modules

```text
Dashboard
│
├── Today
├── Upcoming
├── Inbox
├── Tasks
│   ├── List
│   └── Kanban
├── Projects
├── Habits
├── Calendar
├── Analytics
├── Notifications
└── Settings
```

---

## 🎯 Goals

Productivity Hub aims to provide a single place where users can:

* 📋 Manage everything they need to do
* 🎯 Organize larger projects
* 🔥 Build consistent habits
* 📅 Plan their schedule
* 📊 Understand their productivity
* 🔔 Stay on top of important tasks
* 🔐 Keep personal data secure

---

## 🛣️ Roadmap

Potential future improvements:

* [ ] Mobile/PWA experience
* [ ] Advanced analytics dashboards
* [ ] Team workspaces
* [ ] Calendar integrations
* [ ] Google Calendar integration
* [ ] Task dependencies
* [ ] AI-powered task planning
* [ ] AI productivity insights
* [ ] Advanced recurring-task rules
* [ ] More notification channels
* [ ] Offline-first support

---

## 🤝 Contributing

This project is currently maintained as a personal project.

If the repository becomes open for contributions:

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/your-feature
```

3. Make your changes
4. Run tests

```bash
npm test
npm run lint
npm run build
```

5. Commit your changes

```bash
git commit -m "feat: add your feature"
```

6. Push the branch

```bash
git push origin feature/your-feature
```

7. Open a Pull Request

---

## 📄 License

This project is currently a **private project** and is not released under an open-source license.

---

## 👨‍💻 Author

**Magesh Saran**

Computer Science & Engineering Student
Interested in **Cybersecurity, Web Development, AI, and Software Engineering**.

### Repository

[Productivity Hub on GitHub](https://github.com/mageshsaran805-hue/productivity-hub?utm_source=chatgpt.com)

---

<p align="center">
  Built with ❤️ using Next.js, TypeScript, PostgreSQL & Supabase.
</p>
