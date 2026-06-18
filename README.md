# LTP Learning Centre — School Management Portal

A full-stack web application for managing a homeschool learning centre. Three role-based portals — Admin, Teacher, and Parent — each with their own dashboard and feature set.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Radix UI primitives (shadcn-style) |
| ORM | Prisma v7 |
| Database | PostgreSQL via Neon (serverless) |
| Auth | NextAuth v5 (Auth.js) — JWT sessions |
| File Storage | Vercel Blob (private) |
| Charts | Recharts |
| Guided Tours | Driver.js |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store (for file uploads in production)

### 1. Install dependencies

```bash
npm install
```

> `postinstall` automatically runs `prisma generate`.

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://..."          # Neon connection pooler URL
AUTH_SECRET="your-secret-here"           # Random string, min 32 chars
BLOB_READ_WRITE_TOKEN=""                 # Leave empty for local dev (uses local filesystem)
```

Generate `AUTH_SECRET` with:

```bash
npx auth secret
```

### 3. Push the schema to the database

```bash
npm run db:push
```

### 4. Seed the database

```bash
npm run db:seed
```

This creates three classes (Younger Boys, Older Boys, Girls), sample subjects, and demo accounts for each role (see `prisma/seed.ts` for credentials).

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Other Useful Commands

| Command | Description |
|---|---|
| `npm run db:push` | Sync Prisma schema to the database |
| `npm run db:seed` | Seed the database with demo data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
app/
  admin/          # Admin portal pages
  teacher/        # Teacher portal pages
  parent/         # Parent portal pages
  api/            # API route handlers
components/
  admin/          # Admin-specific components
  teacher/        # Teacher-specific components
  parent/         # Parent-specific components
  layout/         # Shared layout (sidebar, header)
  ui/             # Base UI components (button, card, dialog…)
  charts/         # Recharts wrappers
lib/
  prisma.ts       # Prisma client singleton
  file-storage.ts # Server-only: Vercel Blob / local file upload
  file-utils.ts   # Client-safe: file download URL helper
  utils.ts        # Shared utilities (formatDate, gradeLabel…)
prisma/
  schema.prisma   # Database schema
  seed.ts         # Seed script
```

---

## Roles & Access

| Role | Access |
|---|---|
| **Admin** | Full read/write across all data |
| **Teacher** | Their assigned classes and subjects only |
| **Parent** | Their enrolled children only |

Each role has its own layout with a sidebar. Unauthenticated users are redirected to `/login`.

---

## Classes

The centre runs three class groups:

- **Younger Boys**
- **Older Boys**
- **Girls**

---

## Admin Portal Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/admin` | Overview stats and enrolment charts |
| Students | `/admin/students` | Add / edit / deactivate students, assign class and parent |
| Teachers | `/admin/teachers` | Add / edit teachers, assign subjects and classes |
| Attendance | `/admin/attendance` | View attendance records across all classes |
| Behaviour | `/admin/behaviour` | View behaviour star ratings per class |
| Assessments | `/admin/assessments` | View assessment marks and predicted grades |
| Incidents | `/admin/incidents` | View and manage incident logs |
| Settings | `/admin/settings` | Account settings |

---

## Teacher Portal Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/teacher` | Stats, charts, and student progress summary |
| Assignments | `/teacher/assignments` | Create homework and assessments; attach files; filter by class |
| Enter Marks | `/teacher/marks` | Record marks per assignment per student; filter by subject and class |
| Attendance | `/teacher/attendance` | Mark attendance (Present / Absent / Late) per lesson |
| Behaviour | `/teacher/behaviour` | Rate student behaviour (1–5 stars) per lesson; filter by class |
| Materials | `/teacher/materials` | Upload class handouts; assign to one, multiple, or all classes |
| Reports | `/teacher/reports` | Upload individual student progress reports |
| Deadlines | `/teacher/deadlines` | View upcoming and overdue assignment deadlines |
| Progress | `/teacher/progress` | Subject-level progress and predicted GCSE grades |
| Notices | `/teacher/notices` | Post notices to parents for a specific subject |
| Incidents | `/teacher/incidents` | Log and manage student incidents |
| Settings | `/teacher/settings` | Account settings |

---

## Parent Portal Pages

| Page | Path | Description |
|---|---|---|
| Dashboard | `/parent` | Summary of children's attendance, behaviour, and marks |
| Homework | `/parent/homework` | View assignments and upload completed homework |
| Materials | `/parent/materials` | Download class handouts uploaded by teachers |
| Attendance | `/parent/attendance` | View attendance history per subject |
| Behaviour | `/parent/behaviour` | View star ratings and teacher notes per lesson |
| Progress | `/parent/progress` | Marks and averages per subject |
| Assessments | `/parent/assessments` | View assessment results and predicted grades |
| Reports | `/parent/reports` | Download teacher-uploaded progress reports |
| Deadlines | `/parent/deadlines` | Upcoming homework and assessment deadlines |
| Subjects | `/parent/subjects` | Enrolled subjects for each child |
| Notices | `/parent/notices` | Notices posted by teachers |
| Incidents | `/parent/incidents` | Incident logs for their child |
| Settings | `/parent/settings` | Account settings |

---

## File Uploads

- In **development**: files are saved to `public/uploads/` on the local filesystem.
- In **production**: files are stored privately in Vercel Blob. `BLOB_READ_WRITE_TOKEN` must be set in Vercel environment variables (set up via Vercel → Storage → Blob).
- All download links route through `/api/files/download`, which verifies authentication before returning a signed URL.

---

## Database Schema Highlights

| Model | Description |
|---|---|
| `User` | Shared auth model; linked to `Teacher` or `Parent` via one-to-one relations |
| `Student` | Belongs to one `Class`, linked to a `Parent`, enrolled in `Subject`s via `StudentSubject` |
| `Assignment` | Type: `HOMEWORK` or `ASSESSMENT`; optional class filter; can have an attached file |
| `StudentMark` | Per student per assignment; tracks handed status (PENDING / HANDED / OVERDUE) |
| `Behaviour` | Per student per subject per lesson date; three star ratings (behaviour, attentive, engagement) |
| `Attendance` | Per student per subject per lesson; status: PRESENT / ABSENT / LATE |
| `ClassMaterial` | Teacher-uploaded resource; linked to multiple classes via `ClassMaterialClass` junction table |
| `StudentReport` | Teacher-uploaded report file per student |
| `IncidentLog` | Incident records with severity levels (MINOR / MODERATE / MAJOR) |
| `PredictedGrade` | Teacher's predicted GCSE grade per student per subject |
