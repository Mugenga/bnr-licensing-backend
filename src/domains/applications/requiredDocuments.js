const REQUIRED_DOCUMENTS = {
  'Commercial Bank License': [
    { key: 'incorporation_certificate', label: 'Certificate of incorporation' }
  ],
  'Microfinance License': [
    { key: 'registration_certificate', label: 'Registration certificate' }
  ],
  'Forex Bureau License': [
    { key: 'capital_evidence', label: 'Evidence of minimum capital' }
  ],
  'Mobile Money License': [
    { key: 'technology_architecture', label: 'Technology architecture' }
  ],
  'Insurance License': [
    { key: 'reinsurance_arrangements', label: 'Reinsurance arrangements' }
  ]
};

function getRequiredDocuments(licenseType) {
  return REQUIRED_DOCUMENTS[licenseType] || [];
}

module.exports = { REQUIRED_DOCUMENTS, getRequiredDocuments };
