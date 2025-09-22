
export interface Supplier {
  id: number;
  name: string;
  category: string;
  status: string;
  contact: string;
  email: string;
  phone: string;
  onboardingDate: string;
  contractExpiry: string;
  performanceScore: number;
  riskLevel: string;
  spendYTD: number;
  paymentTerms: string;
  location: string;
  contractStatus?: string;
}

export interface SupplierFormState extends Supplier {
  // Add any additional properties for form state if needed
}
