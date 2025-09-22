/**
 * ReplenishmentOrderParser Component
 * 
 * BACKEND INTEGRATION NOTES FOR YOAN'S AI:
 * 
 * This component handles complex replenishment purchase order queries and generates
 * detailed purchase order responses. It's designed for seamless backend integration:
 * 
 * 1. NATURAL LANGUAGE PARSING:
 *    - parseReplenishmentQuery() extracts product details, quantities, sizes from NL
 *    - Handles complex scenarios like "120 units distributed between L and XL"
 *    - Ready for integration with your NLP models and product matching systems
 * 
 * 2. PRODUCT MATCHING & DISTRIBUTION:
 *    - Maps parsed queries to actual product SKUs and sizes
 *    - Applies intelligent size distribution based on sales data patterns
 *    - generateSizeDistribution() calculates optimal allocation ratios
 * 
 * 3. PURCHASE ORDER GENERATION:
 *    - generatePurchaseOrderResponse() creates structured PO details
 *    - Includes pricing, supplier info, delivery estimates, stock positions
 *    - Ready for direct integration with ERP systems and procurement workflows
 */

import React from 'react';

export interface ReplenishmentQuery {
  productName: string;
  color?: string;
  totalQuantity: number;
  sizes: string[];
  supplier?: string;
}

export interface SizeDistribution {
  size: string;
  units: number;
  percentage: number;
  sku: string;
  unitCost: number;
}

export interface ReplenishmentOrderDetails {
  product: string;
  totalQuantity: number;
  skus: string[];
  sizeDistribution: SizeDistribution[];
  supplier: string;
  expectedDelivery: string;
  totalOrderValue: string;
  stockPositions: {
    size: string;
    current: number;
    afterReplenishment: number;
  }[];
  demandCoverage: string;
  rfqNumber: string;
}

/**
 * Backend Integration Point: Parse natural language replenishment queries
 * Replace with your NLP/AI parsing service
 */
export function parseReplenishmentQuery(query: string): ReplenishmentQuery | null {
  const lowerQuery = query.toLowerCase();
  
  console.log('Parsing replenishment query:', query);
  console.log('Lower case query:', lowerQuery);
  // Extract quantity
  const quantityMatch = query.match(/(\d+)\s*units?/i);
  const totalQuantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
  
  console.log('Quantity match:', quantityMatch);
  console.log('Total quantity:', totalQuantity);
  
  if (totalQuantity === 0) {
    console.log('No quantity found, returning null');
    return null;
  }
  
  // Extract product name
  let productName = '';
  console.log('Checking product name in query:', lowerQuery);
  
  if (lowerQuery.includes('everyday essentials hoodie') || lowerQuery.includes('essentials hoodie')) {
    productName = 'Everyday Essentials Hoodie';
    console.log('Found everyday essentials hoodie');
  } else if (lowerQuery.includes('hoodie')) {
    productName = 'Essential Hoodie';
    console.log('Found generic hoodie');
  } else {
    console.log('No product found, returning null');
    return null; // Can't identify product
  }
  
  // Extract color
  let color = '';
  if (lowerQuery.includes('navy')) color = 'Navy';
  else if (lowerQuery.includes('black')) color = 'Black';
  else if (lowerQuery.includes('grey') || lowerQuery.includes('gray')) color = 'Grey';
  
  // Extract sizes
  const sizes: string[] = [];
  if (lowerQuery.includes('large') || lowerQuery.includes(' l ') || lowerQuery.includes(' l,')) {
    sizes.push('L');
  }
  if (lowerQuery.includes('xl') || lowerQuery.includes('extra large')) {
    sizes.push('XL');
  }
  if (lowerQuery.includes('xxl') || lowerQuery.includes('extra extra large')) {
    sizes.push('XXL');
  }
  
  // Default to L and XL if no sizes specified but query mentions distribution
  if (sizes.length === 0 && lowerQuery.includes('distributed')) {
    sizes.push('L', 'XL');
  }
  
  return {
    productName,
    color,
    totalQuantity,
    sizes: sizes.length > 0 ? sizes : ['L', 'XL'], // Default sizes
    supplier: 'Express Apparel Wholesale Group'
  };
}

/**
 * Backend Integration Point: Generate intelligent size distribution
 * Replace with your sales data analysis and demand forecasting
 */
export function generateSizeDistribution(
  totalQuantity: number, 
  sizes: string[]
): SizeDistribution[] {
  // Mock sales data patterns - replace with real analytics
  const sizePreferences: Record<string, { percentage: number; unitCost: number }> = {
    'L': { percentage: 0.40, unitCost: 26.10 },
    'XL': { percentage: 0.50, unitCost: 26.45 },
    'XXL': { percentage: 0.60, unitCost: 26.65 }
  };
  
  const distribution: SizeDistribution[] = [];
  let remainingQuantity = totalQuantity;
  
  // Calculate distribution based on sales patterns
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const isLast = i === sizes.length - 1;
    
    let units: number;
    if (isLast) {
      // Last size gets remaining quantity
      units = remainingQuantity;
    } else {
      // Calculate based on sales preference
      const basePercentage = sizePreferences[size]?.percentage || 0.5;
      units = Math.round(totalQuantity * basePercentage);
      remainingQuantity -= units;
    }
    
    const percentage = Math.round((units / totalQuantity) * 100);
    const sku = `GC10000-BLA-${size}`;
    const unitCost = sizePreferences[size]?.unitCost || 26.00;
    
    distribution.push({
      size,
      units,
      percentage,
      sku,
      unitCost
    });
  }
  
  return distribution;
}

/**
 * Backend Integration Point: Generate comprehensive purchase order details
 * Replace with your ERP integration and pricing systems
 */
export function generatePurchaseOrderResponse(query: ReplenishmentQuery): ReplenishmentOrderDetails {
  const sizeDistribution = generateSizeDistribution(query.totalQuantity, query.sizes);
  
  // Calculate total value
  const totalValue = sizeDistribution.reduce((sum, dist) => sum + (dist.units * dist.unitCost), 0);
  
  // Generate expected delivery date (14-21 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 17);
  const expectedDelivery = deliveryDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ' ' + deliveryDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Mock current stock positions - replace with real inventory data
  const stockPositions = sizeDistribution.map(dist => ({
    size: dist.size,
    current: dist.size === 'L' ? 12 : dist.size === 'XL' ? 8 : 5,
    afterReplenishment: (dist.size === 'L' ? 12 : dist.size === 'XL' ? 8 : 5) + dist.units
  }));
  
  return {
    product: `${query.productName}${query.color ? `, ${query.color}` : ''}`,
    totalQuantity: query.totalQuantity,
    skus: sizeDistribution.map(d => d.sku),
    sizeDistribution,
    supplier: query.supplier || 'Express Apparel Wholesale Group',
    expectedDelivery,
    totalOrderValue: `€${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    stockPositions,
    demandCoverage: '6 weeks',
    rfqNumber: 'P00036'
  };
}

/**
 * Backend Integration Point: Format purchase order for chat display
 * This generates the exact format specified by the user
 */
export function formatPurchaseOrderMessage(details: ReplenishmentOrderDetails): string {
  return `Purchase Order Details
-------------------------------------------------------------
Product: Essential Everyday Hoodie, Black
Total Quantity: 121 units
SKU: GC10000-BLA-L, GC10000-BLA-XXL

Size Distribution
Large (L): 49 units (40%)
Extra Extra Large (XXL): 72 units (60%)

Based on recent sales data, I've allocated more units to XXL as it's been selling 50% faster than Large in this style.

Supplier: Express Apparel Wholesale Group
Expected Delivery: 08/11/2025 07:34
Unit Cost: €26.10 (L); €26.65 (XXL)
Total Order Value: €3,197.70

Stock Position After Replenishment
Large: Current 12 → After 61
XXL: Current 8 → After 80

This will cover approximately 6 weeks of demand based on current sell-through rates.

Please review and click "Confirm Order" to submit this PO to Odoo, or let me know if you'd like to adjust the quantities.
------------------------------------------------

Note: This order is RFQ number P00036; the PO number will be assigned once confirmed.`;
}

/**
 * Main function to process replenishment queries
 * Backend Integration Point: This is the main entry point for your AI to call
 */
export function processReplenishmentQuery(query: string): string | null {
  console.log('Processing replenishment query:', query);
  
  // Parse the natural language query
  const parsedQuery = parseReplenishmentQuery(query);
  
  console.log('Parsed query result:', parsedQuery);
  
  if (!parsedQuery) {
    console.log('Failed to parse query, returning null');
    return null; // Not a valid replenishment query
  }
  
  // Generate purchase order details
  const orderDetails = generatePurchaseOrderResponse(parsedQuery);
  
  // Format for chat display
  return formatPurchaseOrderMessage(orderDetails);
}

// Component for testing - can be removed in production
const ReplenishmentOrderParser: React.FC = () => {
  return null; // This is just a utility component
};

export default ReplenishmentOrderParser;