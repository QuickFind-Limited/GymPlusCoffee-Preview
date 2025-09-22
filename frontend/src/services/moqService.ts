import { supabaseUrl, supabaseAnonKey } from '@/integrations/supabase/client';
import { Logger } from '@/services/Logger';

export interface MOQData {
  productId: string | number;
  productName: string;
  moq: number;
  supplier?: string;
  price?: number;
  source: 'odoo' | 'default' | 'fallback';
}

export interface MOQProcessingResult {
  productId: string | number;
  originalQuantity: number;
  adjustedQuantity: number;
  moq: number;
  moqApplied: boolean;
  source: 'odoo' | 'default' | 'fallback';
}

export interface MOQServiceResponse {
  success: boolean;
  data?: MOQProcessingResult[];
  processingInfo: {
    moqDataFetched: boolean;
    moqAdjustmentsMade: number;
    fallbackUsed: boolean;
    processingTime: number;
  };
  error?: string;
}

/**
 * MOQ Service - Handles Minimum Order Quantity logic
 * Fetches MOQ data from Odoo and applies max(MOQ, requested_quantity) logic
 */
export class MOQService {
  private static readonly TIMEOUT_MS = 15000; // 15 second timeout
  private static readonly DEFAULT_MOQ = 1;

  /**
   * Apply MOQ logic to a list of products with quantities
   * @param products Array of products with quantities
   * @returns Promise with MOQ processing results
   */
  static async applyMOQLogic(products: Array<{
    id: string | number;
    name: string;
    quantity: number;
    supplier?: string;
  }>): Promise<MOQServiceResponse> {
    const startTime = Date.now();
    const results: MOQProcessingResult[] = [];
    let moqDataFetched = false;
    let fallbackUsed = false;
    let adjustmentsMade = 0;

    try {
      // Fetch MOQ data from Odoo
      const moqData = await this.fetchMOQData(products);
      moqDataFetched = moqData.length > 0;

      // Process each product
      for (const product of products) {
        const moqInfo = moqData.find(m => 
          m.productId === product.id || 
          m.productName.toLowerCase().includes(product.name.toLowerCase())
        );

        const moq = moqInfo?.moq || this.DEFAULT_MOQ;
        const originalQuantity = product.quantity;
        const adjustedQuantity = Math.max(moq, originalQuantity);
        const moqApplied = adjustedQuantity > originalQuantity;
        const source = moqInfo?.source || 'fallback';

        if (moqApplied) {
          adjustmentsMade++;
        }

        if (source === 'fallback') {
          fallbackUsed = true;
        }

        results.push({
          productId: product.id,
          originalQuantity,
          adjustedQuantity,
          moq,
          moqApplied,
          source
        });
      }

      return {
        success: true,
        data: results,
        processingInfo: {
          moqDataFetched,
          moqAdjustmentsMade: adjustmentsMade,
          fallbackUsed,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      Logger.error('MOQService: Error applying MOQ logic:', error);
      
      // Fallback processing - apply default MOQ
      for (const product of products) {
        const originalQuantity = product.quantity;
        const adjustedQuantity = Math.max(this.DEFAULT_MOQ, originalQuantity);
        const moqApplied = adjustedQuantity > originalQuantity;

        if (moqApplied) {
          adjustmentsMade++;
        }

        results.push({
          productId: product.id,
          originalQuantity,
          adjustedQuantity,
          moq: this.DEFAULT_MOQ,
          moqApplied,
          source: 'fallback'
        });
      }

      return {
        success: false,
        data: results,
        processingInfo: {
          moqDataFetched: false,
          moqAdjustmentsMade: adjustmentsMade,
          fallbackUsed: true,
          processingTime: Date.now() - startTime
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Fetch MOQ data from Odoo via Supabase Edge Function
   * @param products Array of products to fetch MOQ for
   * @returns Promise with MOQ data
   */
  private static async fetchMOQData(products: Array<{
    id: string | number;
    name: string;
    supplier?: string;
  }>): Promise<MOQData[]> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/fetch-moq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({
          products: products.map(p => ({
            id: p.id,
            name: p.name,
            supplier: p.supplier
          }))
        }),
        signal: AbortSignal.timeout(this.TIMEOUT_MS)
      });

      if (!response.ok) {
        throw new Error(`MOQ fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.moqData || [];

    } catch (error) {
      Logger.error('MOQService: Error fetching MOQ data:', error);
      throw error;
    }
  }

  /**
   * Validate input data
   * @param products Array of products to validate
   * @returns boolean indicating if input is valid
   */
  static validateInput(products: any[]): boolean {
    if (!Array.isArray(products) || products.length === 0) {
      return false;
    }

    return products.every(product => 
      product &&
      (product.id !== undefined && product.id !== null) &&
      typeof product.name === 'string' &&
      typeof product.quantity === 'number' &&
      !isNaN(product.quantity) &&
      product.quantity >= 0
    );
  }
}

// Export singleton instance for consistent use across the app
export const moqService = new MOQService();