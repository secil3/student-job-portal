# Student Job Portal

Student Job Portal is a full-stack educational MVP that connects students with employers and gives administrators a small set of moderation tools. It provides a local workflow for publishing jobs, applying with an uploaded PDF resume, reviewing applications, and tracking decisions.

> This repository is an MVP for local development and demonstration. It is not presented as production-ready software.

## Roles and current features

### Student

- Register and log in with a student account
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
- Backend: Node.js, Express, JWT, bcrypt, Multer
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

Create an ignored `backend/.env` file. The backend reads the following keys:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=your-local-mysql-user
DB_PASSWORD=your-local-mysql-password
DB_NAME=your-local-database-name
JWT_SECRET=replace-with-a-strong-local-secret
PORT=5050
```

Use the same application database name, user, and password configured in the root `.env` (`MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD`). `PORT` is optional; the backend defaults to `5050`.

The committed `.env.example` does not contain backend JWT or database connection values, so `backend/.env` must currently be prepared manually. Never commit this file.

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

## Known MVP limitations

- Forgot Password returns a local reset link instead of sending email.
- Admin provisioning is manual and is not automated by the repository.
- The frontend API base URL is currently configured for the local backend at `http://localhost:5050/api`.
- The project has not been hardened or configured for public production deployment.
- No migration framework is included for updating existing databases.
- Resume creation and editing are outside the product scope.

## Contributors

- Seçil Keser
- Hilal Aslan

This project was developed for an educational Software Engineering course.
