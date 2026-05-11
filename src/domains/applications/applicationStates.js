const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  ADDITIONAL_DOCUMENTS_REQUESTED: 'additional_documents_requested',
  RESUBMITTED: 'resubmitted',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const VALID_TRANSITIONS = {
  draft: ['submitted'],
  submitted: ['under_review'],
  under_review: ['additional_documents_requested', 'pending_approval'],
  additional_documents_requested: ['resubmitted'],
  resubmitted: ['under_review'],
  pending_approval: ['approved', 'rejected'],
  approved: [],
  rejected: []
};

function canTransition(from, to) {
  return VALID_TRANSITIONS[from]?.includes(to);
}

module.exports = { APPLICATION_STATUS, VALID_TRANSITIONS, canTransition };
