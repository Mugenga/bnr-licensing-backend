# API

Base path: `/api`

All success responses use `{ "data": ... }`. Lists include `{ "meta": { "page", "limit", "total" } }`. Errors use `{ "error": { "message", "code" } }`.

## Auth

`POST /api/auth/login`

```json
{ "email": "applicant@nrb.test", "password": "Password123!" }
```

`GET /api/auth/me`

Requires bearer token.

## Users

Requires `manage_users`.

`GET /api/users`
`GET /api/users/:id`
`POST /api/users`
`PATCH /api/users/:id`
`PATCH /api/users/:id/status`

## Roles and Permissions

Requires `manage_roles`.

`GET /api/roles`
`GET /api/roles/:id`
`POST /api/roles`
`PATCH /api/roles/:id`
`DELETE /api/roles/:id`
`GET /api/permissions`
`PUT /api/roles/:id/permissions`

Roles cannot be assigned both `review_application` and `approve_application`, or both `review_application` and `reject_application`.

## Applications

`GET /api/applications`

Query params: `status`, `applicantUserId`, `page`, `limit`. Applicants only see their own applications.

`GET /api/applications/:id`

`POST /api/applications`

Permission: `create_application`.

```json
{
  "institutionName": "Bank of Kigali",
  "licenseType": "Commercial Bank License",
  "description": "Application for commercial banking license."
}
```

`PATCH /api/applications/:id/submit`

Owner applicant only. `draft -> submitted`.

`PATCH /api/applications/:id/review`

Permission: `review_application`. `submitted/resubmitted -> under_review`.

`PATCH /api/applications/:id/request-documents`

Permission: `request_additional_documents`. `under_review -> additional_documents_requested`.

```json
{ "message": "Please upload audited financial statements for the last 3 years." }
```

`PATCH /api/applications/:id/resubmit`

Owner applicant only. `additional_documents_requested -> resubmitted`.

`PATCH /api/applications/:id/pending-approval`

Permission: `mark_pending_approval`. `under_review -> pending_approval`.

`PATCH /api/applications/:id/approve`

Permission: `approve_application`. Reviewer cannot be the final decision maker.

```json
{ "note": "Application meets all licensing requirements." }
```

`PATCH /api/applications/:id/reject`

Permission: `reject_application`. Reviewer cannot be the final decision maker.

```json
{ "note": "Application does not meet minimum capital requirements." }
```

## Documents

`POST /api/applications/:id/documents`

Permission: `upload_documents`. Owner applicant only. Multipart field: `documents`. Maximum size: 5MB per document. Allowed states: `draft`, `additional_documents_requested`.

`GET /api/applications/:id/documents`

Applicants can see their own documents. Staff need `view_documents`.

`GET /api/documents/:id/download`

Requires ownership or `view_documents`.

## Audit

`GET /api/applications/:id/audit-logs`

Users with `view_audit_logs` see full logs. Applicants with `view_own_audit_summary` can see a limited summary for their own applications.
