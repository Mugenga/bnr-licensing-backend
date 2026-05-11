# Bank Licensing & Compliance Portal Backend 

Welcome to the National Bank of Rwanda Backend API for managing commercial bank licensing & compliance applications.

## 1 Other Resources

- **Frontend Repository:** [bnr-licensing-frontend](https://github.com/Mugenga/bnr-licensing-frontend)
- **Technical Design Document:** [docs/DESIGN.md](docs/DESIGN.md)
- **API Documentation:** [docs/API.md](docs/API.md)
- **Postman Documentation:** Add Postman documentation link here



## 2. Tech Stack

1. **Framework:** Node.js, Express
2. **Database and ORM:** PostgreSQL, Sequelize
3. **Authentication:** JWT, bcrypt-compatible password hashing through `bcryptjs`
4. **Test & Validation:** Joi, Jest

## 3. Architecture Summary

The backend is organized using the domain driven architecture. In this setup the application is divided into multiple domains/modules based on the business logic behind the system. The domains include: auth, users, roles, applications, documents, required documents, audit, and notifications. 

Each domain owns its own routes, controllers, services, repositories, schemas, and constants where applicable. Controllers in each domain handle HTTP shape only; services enforce business rules while repositories handle database access.

## 4. Setup

Below are steps to setup and run the full application.

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
npm test
```

## 5. Database Setup

This backend uses PostgreSQL as database. You need to make sure PostgreSQL is installed.

1. Create a new database called `bank_licensing`.
2. Set `DATABASE_URL` in `.env` to your PostgreSQL database connection string.

Example:

```env
DATABASE_URL=postgres://username:password@localhost:5432/bank_licensing
```

## 6. Environment Variables

* See `.env.example` for all variables required for normal development.

* Email notifications are optional for local development. If `EMAIL_ENABLED` is not true, email notification calls are skipped. If `EMAIL_ENABLED=true`, you need to configure SMTP credentials of your choice, but it is still okay if not set because the application workflow should not fail because of email setup.

## 7. Database Commands

Database commands to migrate database models, seed test data, and reset if needed.

```bash
npm run db:migrate
npm run db:seed
npm run db:reset
```

## 8. Default Users (only seeded while in development environment)

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

## 9. Required Documents

The backend includes support for setting the list of required documents for applications. This allows the system to define the documents an applicant is expected to submit during the application process.

The frontend uses this list when an applicant is creating or viewing an application, so document requirements are visible inside the workflow instead of being handled only through email or separate instructions. Officers can also review uploaded documents against the same required document list.

This keeps document requirements clearer for both applicants and reviewers.

## 10. System Documentation

Please see [docs/](docs/) for full documentation of the system.

* [Technical Design Document](docs/DESIGN.docx)
* [API Documentation](docs/API.md)

## 11. Frontend repo

Please see [Frontend Link](https://github.com/Mugenga/bnr-licensing-frontend) to download and setup the frontend also.