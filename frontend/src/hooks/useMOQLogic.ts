import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MOQService, MOQProcessingResult, MOQServiceResponse } from '@/services/moqService';
import { useToast } from '@/hooks/use-toast';
import { Logger } from '@/services/Logger';

interface Product {
  id: string | number;
  name: string;
  quantity: number;
  supplier?: string;
}

interface ProcessProductsWithMOQResult {
  products: Product[];
  moqInfo: MOQServiceResponse['processingInfo'];
}

interface UseMOQLogicReturn {
  processProductsWithMOQ: (products: Product[]) => Promise<ProcessProductsWithMOQResult>;
  isProcessing: boolean;
  error: Error | null;
}

/**
 * React hook for applying MOQ (Minimum Order Quantity) logic to products
 * Provides loading states, error handling, and user feedback via toasts
 */
export function useMOQLogic(): UseMOQLogicReturn {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const processProductsWithMOQ = async (products: Product[]): Promise<ProcessProductsWithMOQResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Validate input
      if (!MOQService.validateInput(products)) {
        throw new Error('Invalid product data for MOQ processing');
      }

      Logger.debug('Applying MOQ logic to products:', products);
      const result = await MOQService.applyMOQLogic(products);
      
      // Show user feedback if adjustments were made
      if (result.processingInfo.moqAdjustmentsMade > 0) {
        const adjustmentCount = result.processingInfo.moqAdjustmentsMade;
        toast({
          title: "Quantities adjusted",
          description: `${adjustmentCount} product${adjustmentCount > 1 ? 's' : ''} had ${adjustmentCount > 1 ? 'their' : 'its'} quantity increased to meet minimum order requirements.`,
          variant: "default",
        });
      }

      // Show warning if fallback was used
      if (result.processingInfo.fallbackUsed && !result.processingInfo.moqDataFetched) {
        toast({
          title: "MOQ data unavailable",
          description: "Could not fetch MOQ data from supplier. Using default minimum quantities.",
          variant: "destructive",
        });
      }

      // Transform the result to match expected format
      const processedProducts = result.data?.map(moqResult => {
        const originalProduct = products.find(p => p.id.toString() === moqResult.productId.toString());
        return {
          ...originalProduct!,
          quantity: moqResult.adjustedQuantity,
          moq: moqResult.moq,
          moqApplied: moqResult.moqApplied,
          originalQuantity: moqResult.originalQuantity,
          moqSource: moqResult.source
        };
      }) || products;

      return {
        products: processedProducts,
        moqInfo: result.processingInfo
      };

    } catch (error) {
      const err = error as Error;
      setError(err);
      Logger.error('Error applying MOQ logic:', err);
      
      toast({
        title: "MOQ processing failed",
        description: "Could not apply minimum order quantities. Using original quantities.",
        variant: "destructive",
      });

      // Return original products if processing fails
      return {
        products,
        moqInfo: {
          moqDataFetched: false,
          moqAdjustmentsMade: 0,
          fallbackUsed: true,
          processingTime: 0
        }
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processProductsWithMOQ,
    isProcessing,
    error
  };
}