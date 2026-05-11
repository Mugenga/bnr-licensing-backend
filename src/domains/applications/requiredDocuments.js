const REQUIRED_DOCUMENTS = {
  'Commercial Bank License': [
    { key: 'incorporation_certificate', label: 'Certificate of incorporation' },
    { key: 'business_plan', label: 'Business plan' },
    { key: 'audited_financial_statements', label: 'Audited financial statements' },
    { key: 'capital_evidence', label: 'Evidence of paid-up capital' },
    { key: 'governance_structure', label: 'Governance structure' }
  ],
  'Microfinance License': [
    { key: 'registration_certificate', label: 'Registration certificate' },
    { key: 'business_plan', label: 'Business plan' },
    { key: 'capital_evidence', label: 'Evidence of minimum capital' },
    { key: 'risk_management_policy', label: 'Risk management policy' }
  ],
  'Forex Bureau License': [
    { key: 'registration_certificate', label: 'Registration certificate' },
    { key: 'business_plan', label: 'Business plan' },
    { key: 'capital_evidence', label: 'Evidence of minimum capital' },
    { key: 'fit_and_proper_forms', label: 'Fit and proper forms' }
  ],
  'Mobile Money License': [
    { key: 'registration_certificate', label: 'Registration certificate' },
    { key: 'business_plan', label: 'Business plan' },
    { key: 'technology_architecture', label: 'Technology architecture' },
    { key: 'risk_management_policy', label: 'Risk management policy' },
    { key: 'consumer_protection_policy', label: 'Consumer protection policy' }
  ],
  'Insurance License': [
    { key: 'registration_certificate', label: 'Registration certificate' },
    { key: 'business_plan', label: 'Business plan' },
    { key: 'audited_financial_statements', label: 'Audited financial statements' },
    { key: 'capital_evidence', label: 'Evidence of minimum capital' },
    { key: 'reinsurance_arrangements', label: 'Reinsurance arrangements' }
  ]
};

function getRequiredDocuments(licenseType) {
  return REQUIRED_DOCUMENTS[licenseType] || [];
}

module.exports = { REQUIRED_DOCUMENTS, getRequiredDocuments };
