// Shared constants for shipment documents and insurance claims.
// Safe to import from both client and server code.

export const DOC_TYPES = [
  "COLLECTION_REPORT",
  "DELIVERY_REPORT",
  "PROOF_OF_DELIVERY",
  "PAYMENT_RECEIPT",
  "INVOICE",
  "PHOTOS",
  "OTHER",
];

export const DOC_TYPE_LABELS = {
  COLLECTION_REPORT: "Driver's Collection Report",
  DELIVERY_REPORT: "Delivery / Hand-over Report",
  PROOF_OF_DELIVERY: "Signed Proof of Delivery",
  PAYMENT_RECEIPT: "Payment Receipt",
  INVOICE: "Invoice / Payment Document",
  PHOTOS: "Photos",
  OTHER: "Other Document",
};

export const DOC_TYPE_STYLES = {
  COLLECTION_REPORT: "bg-blue-50 text-blue-700",
  DELIVERY_REPORT: "bg-teal-50 text-teal-700",
  PROOF_OF_DELIVERY: "bg-green-50 text-green-700",
  PAYMENT_RECEIPT: "bg-amber-50 text-amber-700",
  INVOICE: "bg-amber-50 text-amber-700",
  PHOTOS: "bg-purple-50 text-purple-700",
  OTHER: "bg-navy-50 text-navy-600",
};

export const CLAIM_STATUSES = [
  "REPORTED",
  "UNDER_REVIEW",
  "APPROVED",
  "SETTLED",
  "REJECTED",
];

export const CLAIM_STATUS_LABELS = {
  REPORTED: "Reported",
  UNDER_REVIEW: "Under Review by Insurer",
  APPROVED: "Approved",
  SETTLED: "Settled",
  REJECTED: "Rejected",
};

export const CLAIM_STATUS_STYLES = {
  REPORTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  SETTLED: "bg-teal-100 text-teal-700",
  REJECTED: "bg-red-100 text-red-700",
};

// Ordered checklist of documents typically required for an insurance claim.
export const CLAIM_DOC_TYPES = [
  { key: "ACCIDENT_REPORT", label: "Accident / Incident Report" },
  { key: "DRIVER_STATEMENT", label: "Driver's Statement" },
  { key: "PHOTOS_VIDEOS", label: "Photos & Videos of Vehicle / Damage" },
  { key: "COLLECTION_REPORT", label: "Vehicle Collection Report" },
  { key: "DELIVERY_REPORT", label: "Vehicle Delivery Report" },
  { key: "POLICE_REPORT", label: "Police Report / Crime Reference Number" },
  { key: "THIRD_PARTY", label: "Third-Party Details & Insurance Information" },
  { key: "REPAIR_ESTIMATE", label: "Repair Estimate / Quotation" },
  { key: "REPAIR_INVOICES", label: "Repair Invoices" },
  { key: "REGISTRATION", label: "Vehicle Registration & Ownership Documents" },
  { key: "POLICY_DETAILS", label: "Insurance Policy / Claim Reference Details" },
  { key: "CORRESPONDENCE", label: "Correspondence with Insurance Company" },
  { key: "ADDITIONAL", label: "Additional Documents Requested by Insurer" },
  { key: "SETTLEMENT", label: "Final Insurance Settlement / Claim Outcome" },
];

export const CLAIM_DOC_STATUSES = [
  "REQUIRED",
  "PENDING",
  "SUBMITTED",
  "RECEIVED",
  "APPROVED",
  "NOT_APPLICABLE",
];

export const CLAIM_DOC_STATUS_LABELS = {
  REQUIRED: "Required",
  PENDING: "Pending",
  SUBMITTED: "Submitted",
  RECEIVED: "Received",
  APPROVED: "Approved",
  NOT_APPLICABLE: "Not Applicable",
};

export const CLAIM_DOC_STATUS_STYLES = {
  REQUIRED: "bg-red-50 text-red-600",
  PENDING: "bg-amber-50 text-amber-700",
  SUBMITTED: "bg-blue-50 text-blue-700",
  RECEIVED: "bg-purple-50 text-purple-700",
  APPROVED: "bg-green-50 text-green-700",
  NOT_APPLICABLE: "bg-navy-50 text-navy-400",
};

// Statuses that mean the document is still outstanding from the customer's view.
export const OUTSTANDING_CLAIM_DOC_STATUSES = ["REQUIRED", "PENDING"];

export const MAX_UPLOAD_SIZE = 25 * 1024 * 1024; // 25 MB
