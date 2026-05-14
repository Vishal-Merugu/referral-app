# Referral App

A comprehensive full-stack application designed to streamline the referral process, manage appointments, and track referral pipelines.

## 🚀 Tech Stack

### Frontend (Client)
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **UI Components:** Radix UI, Lucide React
- **Document Parsing:** Mammoth (Word), PDF.js (PDF)
- **Real-time:** Socket.IO Client

### Backend (Server)
- **Runtime:** Node.js with Express
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Passport.js (JWT, LinkedIn OAuth2), bcryptjs
- **AI/LLM Integrations:** OpenAI, Google Generative AI
- **Real-time:** Socket.IO
- **Email:** Nodemailer

## 📁 Project Structure

This is a monorepo containing both the frontend client and the backend server.

- `/client` - Next.js frontend application
- `/server` - Express.js backend application

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database
- API Keys (OpenAI, Gemini, LinkedIn Auth, etc.) depending on environment configuration.

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables. Copy `.env.example` to `.env` and fill in your values.
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (if any) in `.env.local`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## 🤝 Features
- **Authentication:** Secure login with JWT and LinkedIn OAuth.
- **Referral Pipeline:** Track referrals through various stages.
- **Appointments:** Schedule and manage appointments.
- **Real-time Chat:** Instant messaging using Socket.IO.
- **AI Integration:** Leverage AI for document parsing and embeddings.
- **Email Notifications:** Automated email updates and alerts.

## 📄 License
ISC
