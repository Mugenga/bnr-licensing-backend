// keeps API camelCase while db stays snake_case.

function userDto(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    roleId: user.role_id,
    roleName: user.Role?.name,
    role: user.Role ? {
      id: user.Role.id,
      name: user.Role.name,
      description: user.Role.description,
      isSystemRole: user.Role.is_system_role,
      permissions: user.Role.Permissions?.map((permission) => permission.name) || []
    } : undefined,
    organization: user.organization_name,
    organizationName: user.organization_name,
    status: user.status,
    createdAt: user.created_at || user.createdAt,
    updatedAt: user.updated_at || user.updatedAt
  };
}

function applicationDto(application) {
  return {
    id: application.id,
    referenceNumber: application.reference_number,
    applicantUserId: application.applicant_user_id,
    institutionName: application.institution_name,
    licenseType: application.license_type,
    description: application.description,
    status: application.status,
    reviewedBy: application.reviewed_by,
    reviewedAt: application.reviewed_at,
    finalDecisionBy: application.final_decision_by,
    finalDecisionAt: application.final_decision_at,
    finalDecisionNote: application.final_decision_note,
    version: application.version,
    createdAt: application.created_at || application.createdAt,
    updatedAt: application.updated_at || application.updatedAt
  };
}

function documentDto(document) {
  return {
    id: document.id,
    applicationId: document.application_id,
    uploadedBy: document.uploaded_by,
    originalName: document.original_name,
    storedName: document.stored_name,
    documentType: document.document_type,
    mimeType: document.mime_type,
    sizeBytes: document.size_bytes,
    version: document.version,
    createdAt: document.created_at || document.createdAt
  };
}

function auditDto(log) {
  return {
    id: log.id,
    applicationId: log.application_id,
    actorUserId: log.actor_user_id,
    action: log.action,
    fromStatus: log.from_status,
    toStatus: log.to_status,
    metadata: log.metadata,
    createdAt: log.created_at || log.createdAt
  };
}

module.exports = { userDto, applicationDto, documentDto, auditDto };
