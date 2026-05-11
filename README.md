# Bank Licensing & Compliance Portal Backend

Welcome to the National Bank of Rwanda Backend API for managing commercial bank licensing & compliance applications.

## NOTE: Frontend repo

Pleasee see [Frontend Link](https://github.com/Mugenga/bnr-licensing-frontend) to download and setup the frontend also. 

## Tech Stack

1. **Framework:**  Node.js, Express, 
2. **Database and ORM:** PostgreSQL, Sequelize
3. **Authentication:**  JWT, bcrypt-compatible password hashing through `bcryptjs`
4. **Test & Validation:** Joi, Jest

## Architecture Summary

The backend is organized using the domain driven architecture. In this setup the application is divided into multiple domains (modules) based on the business logic behind the system, the domains include: auth, users, roles, applications, documents, audit, and notifications. 

Each domain owns its own routes, controllers, services, repositories, schemas, and constants where applicable. Controllers in each domain handle HTTP shape only; services enforce business rules while repositories handle database access.

## Setup

Below are steps to setup and run the full application

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
npm test
```

## Database Setup

This backend uses postgres as database, you need to make sure POSTGRES is instaled

1. create a new database [bank licending](bank_licensing)
2. Set `DATABASE_URL` in `.env` to a PostgreSQL database.

## Environment Variables

- See `.env.example` for all variables. Required for normal development.

- Email notifications are optional for local development. If `EMAIL_ENABLED` is not true, email notification calls are skipped. If `EMAIL_ENABLED=true` you need to configure SMTP credentials of your choice, but it is still okay if not set. 

## Database Commands

database commands to migrate database models, seed test data and reset if needed.

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
```

## Default Users (only seeded while in development environment)

Super Admin:
email: `superadmin@bnr.rw`
password: `Password123!`

Applicant:
email: `applicant@bnr.rw`
password: `Password123!`

Officer:
email: `officer@bnr.rw`
password: `Password123!`

Approver:
email: `approver@bnr.rw`
password: `Password123!`

## System Documentation

Please see [docs/]() for full documentation of the system [docs/API.md](docs/API.md).

## Frontend repo

Pleasee see [Frontend Link](https://github.com/Mugenga/bnr-licensing-frontend) to download and setup the frontend also. 


