# Design

## Architecture

The backend uses domain-driven modules: auth, users, roles, applications, documents, audit, and notifications. Each domain owns route/controller/service/repository/schema files where useful. Controllers translate HTTP requests and responses. Services enforce permissions, ownership, workflow, audit, and notification rules. Repositories isolate Sequelize access.

## Data Model

Users belong to roles. Roles are assigned permissions through role_permissions. Applications belong to applicant users and carry review/final decision fields. Application documents are versioned and linked to applications. Audit logs record important workflow actions permanently.

## State Machine

| From | To | Actor |
| --- | --- | --- |
| draft | submitted | Applicant |
| submitted | under_review | Officer |
| under_review | additional_documents_requested | Officer |
| additional_documents_requested | resubmitted | Applicant |
| resubmitted | under_review | Officer |
| under_review | pending_approval | Officer |
| pending_approval | approved | Approver |
| pending_approval | rejected | Approver |

Final states, `approved` and `rejected`, have no outgoing transitions.

## Roles and Permissions

Applicants can create and manage only their own applications and documents. Officers review and request additional documents, but cannot approve or reject. Approvers decide, but do not review. Superadmin manages users and roles but does not bypass workflow rules. Custom roles are supported, while dangerous permission combinations such as review plus approve/reject are blocked.

## Non-Negotiable Requirements

Authentication and authorization are handled with JWT plus database-loaded permissions. Workflow integrity is enforced by the application service state machine and separation-of-duties checks. Audit entries are append-only and are created inside the same transaction as workflow changes. Documents use local simulated storage, server-side size limits, ownership checks, and versioning. API responses use consistent success and error shapes. Frontend support comes from simple REST endpoints and camelCase response fields. Notifications are safe and non-blocking.

## Concurrency Handling

When an application workflow action starts, the service loads the application row using `SELECT ... FOR UPDATE` through Sequelize transaction locking. This prevents two users from changing the same application at the same time. The second request waits, then re-checks the state after the first transaction commits. If the state is no longer valid, the transition is rejected.

## Audit Log Legal Evidence

Audit logs are append-only at the database level using PostgreSQL triggers that reject `UPDATE` and `DELETE`. Application code exposes no update or delete endpoint for audit logs. Audit entries are inserted in the same transaction as the application action, so the workflow change and audit record succeed or fail together.

## Notification Design

Email notifications are triggered after successful workflow commits for applicant-facing events. Notification delivery is intentionally non-blocking. If email is disabled, unconfigured, or temporarily failing, the application workflow still succeeds. This prevents infrastructure issues in the email layer from corrupting or blocking the regulatory workflow.

## Trade-offs

File storage is local because the challenge asks to simulate storage. In production, this would move to object storage with signed URLs and malware scanning.

JWT is used for simplicity and stateless API access. In production, refresh tokens, token revocation, and stricter session controls would be added.

Permissions are database-driven to support future custom roles, but the workflow still enforces critical business rules in code so a bad role configuration cannot break regulatory separation of duties.

The audit log is append-only in PostgreSQL, but production legal evidence requirements may also require cryptographic hash chaining or external immutable storage.

Email notifications are optional and non-blocking in this implementation. In production, notification events would likely be queued and retried through a background worker or messaging service.
