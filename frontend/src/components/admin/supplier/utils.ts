
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-gray-100 text-gray-800';
    case 'under review':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getRiskColor = (risk: string): string => {
  switch (risk) {
    case 'low':
      return 'text-green-600';
    case 'medium':
      return 'text-yellow-600';
    case 'high':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const getPerformanceColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-yellow-600';
  return 'text-red-600';
};

export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const getContractStatus = (supplier: any): string => {
  // If supplier has explicit contractStatus, use it
  if (supplier.contractStatus) {
    return supplier.contractStatus;
  }
  
  // Otherwise, determine status based on contract expiry date
  return new Date(supplier.contractExpiry) > new Date() ? 'active' : 'expired';
};

export const categories = [
  'Textiles & Fabrics',
  'Clothing & Apparel',
  'Jewelry & Accessories',
  'Footwear',
  'Packaging & Display',
  'Visual Merchandising',
  'Marketing Services',
  'Photography & Content',
  'Logistics & Shipping',
  'Sustainable Materials'
];

export const paymentTermsOptions = [
  'Net 15',
  'Net 30',
  'Net 45',
  'Net 60',
  'Net 90',
  '2/10 Net 30'
];

export const riskLevelOptions = [
  'low',
  'medium',
  'high'
];
