# Referral App

A full-stack referral marketplace prototype for employees who post opportunities and job seekers who discover them, request introductions, and manage follow-up.

## Features in the codebase

- Employee and seeker accounts with JWT authentication, profile editing, and role-specific views.
- Referral posts with search filters, skills, salary range, work mode, and saved listings.
- Resume upload and text extraction in the browser for PDF, DOCX, and plain text.
- Optional Gemini-based extraction of role, experience, skills, and work-mode filters from resume text.
- Appointment requests, availability slots, messaging, notifications, and reviews.
- Company pages, resource listings, analytics, and admin endpoints.

Resume parsing happens in the client. The AI endpoint converts extracted resume text into search filters; it does not perform semantic or vector matching. The OpenAI/Gemini embedding helper is present in the server but is not wired into the matching flow.

## Stack

- Client: Next.js 16, React 19, TypeScript, Tailwind CSS, Radix UI, Framer Motion
- Server: Node.js, Express 5, TypeScript, Prisma 7, PostgreSQL
- Realtime: Socket.IO
- AI: Gemini filter extraction (optional; set GOOGLE_API_KEY or GEMINI_API_KEY)
- Other integrations: Nodemailer, PDF.js, Mammoth

Authentication is implemented with JWT and bcrypt. The current source does not implement Passport or LinkedIn OAuth.

## Run locally

### Requirements

- Node.js
- PostgreSQL

Create the server environment file and set a PostgreSQL connection string plus a JWT secret of at least 16 characters:

~~~bash
cp server/.env.example server/.env
~~~

Install the server packages, generate Prisma Client, apply the checked-in migration, then start the API:

~~~bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
~~~

The API listens on http://localhost:4000 by default.

In another terminal, start the web app:

~~~bash
cd client
npm install
npm run dev
~~~

The client uses http://localhost:4000/api by default. Set NEXT_PUBLIC_API_URL in client/.env.local if your API runs elsewhere.

## Build commands

~~~bash
cd server
npm run build
~~~

~~~bash
cd client
npm run build
npm run lint
~~~

The server package’s test script is currently a placeholder; there is no configured automated test suite.

## Security and deployment status

**Do not deploy this version with real users or private messages yet.** The HTTP endpoints use JWT middleware, but the Socket.IO server currently accepts connections without authenticating the handshake and trusts client-supplied room/user IDs when joining rooms or broadcasting events. Add socket authentication and authorization before making the service public.

The repository provides source code for a prototype. It does not include a production deployment configuration.
