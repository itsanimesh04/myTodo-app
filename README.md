# 🎯 MyTodo - House Accountability & Task Management App

A modern, full-stack collaborative task management and accountability web application built with **Next.js 16**, **React 19**, **Prisma**, **NextAuth.js**, and **Tailwind CSS**.

---

## ✨ Features

- 🏠 **House & Group Accountability**
  - Create or join collaborative "Houses" with unique invite codes.
  - Track shared progress alongside your housemates or team members.
  - Member management and role tracking.

- ✅ **Smart Task Management**
  - Create, edit, prioritize (`Low`, `Medium`, `High`, `Urgent`), and organize tasks.
  - Set task visibility (`Shared` with house vs. `Private`).
  - Due dates, recurring rules, and quick completion toggles.

- 🎯 **Targets & Goals**
  - Define custom targets (e.g. daily/weekly task completion metrics).
  - Visual progress tracking with interactive charts and metrics.

- ⚡ **Real-Time Activity Feed & Reactions**
  - Live activity feed powered by **Server-Sent Events (SSE)**.
  - Celebrate accomplishments with emoji reactions.
  - Real-time in-app notifications.

- 🌓 **Modern UI & Theming**
  - Dark / Light / System theme support.
  - Responsive design with smooth animations and toast notifications.

- 🔐 **Secure Authentication**
  - Email/Password authentication using **NextAuth.js (v5 Beta)** & bcrypt password hashing.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Frontend:** [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React Icons](https://lucide.dev/)
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/) with SQLite (`better-sqlite3`)
- **Authentication:** [NextAuth.js v5](https://authjs.dev/)
- **Validation:** [Zod](https://zod.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/itsanimesh04/myTodo-app.git
cd myTodo-app/accountability-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

Ensure your `.env` contains:

```env
AUTH_SECRET="your-generated-secret"
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
```

> **Tip:** You can generate a random `AUTH_SECRET` using `npx auth secret` or `openssl rand -base64 32`.

### 4. Database Setup & Migration

Run Prisma migrations to initialize the SQLite database:

```bash
npx prisma migrate dev --name init
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📁 Project Structure

```text
accountability-app/
├── prisma/
│   ├── schema.prisma           # Prisma database models & relationships
│   └── migrations/             # SQL migration files
├── src/
│   ├── app/
│   │   ├── (app)/              # Authenticated application routes
│   │   │   ├── dashboard/      # Main dashboard & activity feed
│   │   │   ├── house/          # House management & members
│   │   │   ├── tasks/          # Task management
│   │   │   ├── targets/        # Goals & target tracking
│   │   │   ├── progress/       # Analytics & stats
│   │   │   ├── notifications/  # Notification center
│   │   │   └── settings/       # User profile & preferences
│   │   ├── (auth)/             # Authentication routes (login/signup)
│   │   └── api/                # API routes & SSE endpoints
│   ├── components/             # Reusable UI components & navigation
│   ├── hooks/                  # Custom React hooks (e.g. useRealTime)
│   ├── lib/                    # Utilities, constants, and Prisma client
│   └── types/                  # TypeScript types & definitions
├── public/                     # Static assets
└── package.json
```

---

## 📜 Scripts

- `npm run dev` — Start development server with Turbopack / Next.js
- `npm run build` — Build the application for production
- `npm run start` — Start the production server
- `npm run lint` — Run ESLint check
- `npx prisma studio` — Open Prisma Studio GUI for database inspection

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
