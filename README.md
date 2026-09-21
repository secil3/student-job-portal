# Student Job Portal

Student Job Portal is a full-stack educational MVP that connects students with employers and gives administrators a small set of moderation tools. It provides a local workflow for publishing jobs, applying with an uploaded PDF resume, reviewing applications, and tracking decisions.

> This repository is an MVP for local development and demonstration. It is not presented as production-ready software.

## Roles and current features

### Student

- Register only with an Aydın Adnan Menderes University student address ending exactly in `@stu.adu.edu.tr`
- Verify the student email address before submitting job applications
- Log in and browse jobs while email verification is pending
- Maintain university, major, and GPA profile fields
- Browse available job postings
- Upload, list, rename, open, and delete owned PDF resumes
- Select an uploaded resume when applying for a job
- Prevent duplicate applications and show `Already Applied`
- Track applications and filter them by pending, accepted, or rejected status

### Employer

- Register an employer account (new employers start as `pending`)
- Log in after an administrator approves the account
- Create, edit, and delete owned job postings
- View applications submitted to owned jobs
- Open an applicant's resume through the protected resume endpoint
- Accept or reject applications

### Admin

- View platform totals and registered users
- Review and approve or reject pending employer accounts
- Review job postings and delete inappropriate postings

## MVP scope

The application accepts existing PDF resume files. It does **not** contain a resume builder, resume editor, resume analysis, or AI resume feature.

The password-reset flow generates a local reset link in the API response. It does **not** send email. Other production concerns such as deployment configuration, rate limiting, monitoring, and a production secret-management system are outside the current MVP.

## Technology

- Frontend: React 19, React Router, Axios, Vite, CSS
- Backend: Node.js, Express, JWT, bcrypt, Multer, Nodemailer
- Database: MySQL 8 with `mysql2`
- Testing and quality: Jest, Node's test runner, ESLint, Vite production build
- Local database orchestration: Docker Compose

## Requirements

Install the following before starting:

- Git
- Node.js and npm (the repository does not pin an exact Node.js version)
- Docker with Docker Compose support

The default local configuration uses:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5050`
- MySQL host port: `3307`

Make sure these ports are available, or update the relevant local configuration deliberately.

## Local setup

Run all commands from the repository root unless a step says otherwise.

### 1. Clone and enter the repository

```bash
git clone https://github.com/secil3/student-job-portal.git
cd student-job-portal
```

### 2. Prepare Docker environment variables

Create the ignored root `.env` from the tracked example:

```bash
cp .env.example .env
```

Replace every placeholder in `.env` with local values. The file supplies these variables to Docker Compose:

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

Do not commit `.env` or put real credentials in documentation.

### 3. Start MySQL

```bash
docker compose up -d mysql
```

The Compose service publishes MySQL on host port `3307` and stores data in the named `mysql_data` volume.

The tracked [`docker/mysql/init.sql`](docker/mysql/init.sql) file is mounted read-only under `/docker-entrypoint-initdb.d/`. The official MySQL image runs files in that directory only when it initializes a **new, empty data volume**. Editing `init.sql` does not migrate an existing volume, and restarting an existing container does not rerun the schema automatically.

Do not use `docker compose down -v` when you need to preserve the existing local database; `-v` removes the named data volume.

### 4. Prepare the backend environment

Create the ignored backend configuration from its tracked example:

```bash
cp backend/.env.example backend/.env
```

Replace every placeholder in `backend/.env` with local values. Use the same application database name, user, and password configured in the root `.env` (`MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD`). `PORT` is optional; the backend defaults to `5050`.

The backend example also contains the SMTP settings required for student email verification:

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST` | SMTP server hostname; use `smtp.gmail.com` for Gmail |
| `SMTP_PORT` | SMTP port; the current Gmail example uses `465` with TLS |
| `SMTP_USER` | Gmail account used to authenticate with SMTP |
| `SMTP_APP_PASSWORD` | Google app password used by the backend |
| `EMAIL_FROM` | Sender shown on verification messages |
| `FRONTEND_URL` | Frontend origin used to build the `/verify-email` link, such as `http://localhost:5173` |

A Gmail app password is different from the account's normal sign-in password. Keep the real Gmail address and app password only in the Git-ignored `backend/.env`; never put them in source files, examples, logs, or documentation. Gmail service availability, quotas, and delivery limits depend on Google's policies and are not guaranteed by this project.

Student registration requires working SMTP configuration to deliver the verification link. If email delivery fails, the API reports that the account was created but the verification message could not be sent; it does not report successful delivery. The student remains unverified and can request another message from the verification page.

### 5. Install dependencies and start the backend

```bash
cd backend
npm install
npm start
```

For development with automatic restarts, use `npm run dev` instead of `npm start`.

### 6. Install dependencies and start the frontend

In a second terminal, from the repository root:

```bash
cd student-job-portal-frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## ADÜ student email verification

The student pilot is restricted to Aydın Adnan Menderes University student email accounts:

- The backend normalizes email addresses and accepts only an exact `@stu.adu.edu.tr` domain match.
- Addresses ending in `@adu.edu.tr`, subdomains, or look-alike suffixes are not accepted as student addresses.
- A new student is stored with `is_verified = 0`.
- The verification link contains a cryptographically random, single-use token valid for **30 minutes**.
- Only the token hash and expiry are stored in MySQL; the raw token is sent only in the verification link.
- A successful verification sets `is_verified = 1` and clears the stored token hash and expiry.
- Unverified students may log in and browse jobs, but the backend rejects job applications until the current database record is verified.

The `/verify-email` frontend page submits the token to `POST /api/auth/verify-email`. It also supports requesting another message through `POST /api/auth/resend-verification`. Resend responses are deliberately generic, and the current backend applies an in-memory limit of three requests per email address in a 15-minute window. This limit resets when the backend process restarts and is not a replacement for production-grade distributed rate limiting.

## Admin account provisioning

The repository does not seed an admin account, does not include sample admin credentials, and does not expose an endpoint that creates admins. Public registration intentionally accepts only `student` and `employer` roles.

An admin account must therefore already exist in the target database or be provisioned separately by an authorized local database operator. Any provisioned password must be stored as a bcrypt hash compatible with the login controller. Do not add plaintext passwords, hashes, or personal email addresses to tracked files.

Because there is no automated admin bootstrap command in this repository, fresh-install admin provisioning cannot be completed through the application UI alone.

## Resume upload rules

- Only PDF files are accepted.
- The server checks extension, MIME type, and the PDF file signature.
- Maximum file size: **5 MB**.
- Stored files receive random server-generated names.
- Resume files are served through authenticated, ownership-aware endpoints rather than public upload URLs.
- There is no resume builder; students upload an existing PDF.

## Tests and quality checks

### Backend tests

```bash
cd backend
npm test
```

Coverage command:

```bash
npm run test:cov
```

### Frontend tests

The current frontend unit tests use Node's built-in test runner:

```bash
cd student-job-portal-frontend
node --test src/__tests__/*.test.js
```

### Frontend lint

```bash
cd student-job-portal-frontend
npm run lint
```

### Frontend production build

```bash
cd student-job-portal-frontend
npm run build
```

The build output is generated in the ignored `student-job-portal-frontend/dist` directory.

## Database initialization notes

The initialization script creates these tables on a new empty MySQL volume:

- `users`
- `jobs`
- `resumes`
- `applications`

It creates schema only; it does not insert example users, jobs, applications, resumes, or an admin account. Existing installations require deliberate migrations when the schema changes. Do not reset a populated volume merely to rerun `init.sql`.

For a new empty MySQL volume, `docker/mysql/init.sql` already creates the student verification columns and sets the `is_verified` default to `0`.

For an existing database created before email verification was added, first create and verify a restorable backup. Then configure `backend/.env` for that database and run the targeted migration from the backend directory:

```bash
cd backend
npm run migrate:email-verification
```

The script adds the missing token-hash and expiry columns and changes the `is_verified` default for future rows to `0`. It does not bulk-update existing users' verification values. The script checks for the new columns before adding them, but it still performs an `ALTER TABLE` for the default; run it deliberately against the intended database rather than as an application startup step.

## Known MVP limitations

- Forgot Password returns a local reset link instead of sending email.
- Admin provisioning is manual and is not automated by the repository.
- The frontend API base URL is currently configured for the local backend at `http://localhost:5050/api`.
- The project has not been hardened or configured for public production deployment.
- No general migration framework is included. The repository currently provides only the targeted `migrate:email-verification` script for the verification schema change.
- Verification-email resend limiting is process-local and resets when the backend restarts.
- Resume creation and editing are outside the product scope.

## Contributor

- Seçil Keser

