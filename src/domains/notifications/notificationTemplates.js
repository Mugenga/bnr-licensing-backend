function base(referenceNumber, body) {
  return `Dear applicant,\n\n${body}\n\nRegards,\nBank Licensing & Compliance Portal`;
}

module.exports = {
  submitted: (application) => ({
    subject: `Application submitted: ${application.reference_number}`,
    text: base(application.reference_number, `Your application ${application.reference_number} has been submitted.`)
  }),
  additionalDocumentsRequested: (application, message) => ({
    subject: 'Additional documents requested for your application',
    text: base(
      application.reference_number,
      `Additional documents have been requested for application ${application.reference_number}.\n\nMessage:\n${message}\n\nPlease log in to the Bank Licensing & Compliance Portal and upload the required documents.`
    )
  }),
  resubmitted: (application) => ({
    subject: `Application resubmitted: ${application.reference_number}`,
    text: base(application.reference_number, `Your application ${application.reference_number} has been resubmitted.`)
  }),
  approved: (application, note) => ({
    subject: `Application approved: ${application.reference_number}`,
    text: base(application.reference_number, `Your application ${application.reference_number} has been approved.\n\nDecision note:\n${note}`)
  }),
  rejected: (application, note) => ({
    subject: `Application rejected: ${application.reference_number}`,
    text: base(application.reference_number, `Your application ${application.reference_number} has been rejected.\n\nDecision note:\n${note}`)
  })
};
