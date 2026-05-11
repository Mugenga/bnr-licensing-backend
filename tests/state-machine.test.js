const { APPLICATION_STATUS, canTransition } = require('../src/domains/applications/applicationStates');

describe('application state machine', () => {
  test('allows valid transitions', () => {
    expect(canTransition('draft', 'submitted')).toBe(true);
    expect(canTransition('submitted', 'under_review')).toBe(true);
    expect(canTransition('under_review', 'additional_documents_requested')).toBe(true);
    expect(canTransition('additional_documents_requested', 'resubmitted')).toBe(true);
    expect(canTransition('resubmitted', 'under_review')).toBe(true);
    expect(canTransition('under_review', 'pending_approval')).toBe(true);
    expect(canTransition('pending_approval', 'approved')).toBe(true);
    expect(canTransition('pending_approval', 'rejected')).toBe(true);
  });

  test('rejects invalid jumps and final-state transitions', () => {
    expect(canTransition('submitted', 'approved')).toBe(false);
    expect(canTransition('additional_documents_requested', 'approved')).toBe(false);
    expect(canTransition(APPLICATION_STATUS.APPROVED, 'under_review')).toBe(false);
    expect(canTransition(APPLICATION_STATUS.REJECTED, 'under_review')).toBe(false);
  });
});
