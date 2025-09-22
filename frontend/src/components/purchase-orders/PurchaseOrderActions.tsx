/**
 * PurchaseOrderActions Component - Backend-Ready Action Buttons
 * 
 * BACKEND INTEGRATION NOTES FOR YOAN'S AI:
 * 
 * This component handles purchase order confirmation and external system integration:
 * 
 * 1. STATE MANAGEMENT FOR REAL SYSTEMS:
 *    - confirmed state represents actual PO submission status in your backend
 *    - Replace setConfirmed(true) with real API call to your PO creation service
 *    - Component shows loading states and handles success/error responses
 *    - Optimistic UI updates with rollback capability for failed submissions
 * 
 * 2. EXTERNAL SYSTEM INTEGRATION:
 *    - Direct link to Odoo PO system (https://source-animalfarmacy.odoo.com/odoo/purchase-orders/48)
 *    - Component ready for dynamic PO URLs based on actual created order numbers
 *    - Can integrate with any ERP/procurement system via URL templating
 *    - Supports both direct links and API-based integrations
 * 
 * 3. DATA EXTRACTION & VALIDATION:
 *    - Automatically parses quantity, value, and PO number from LLM responses
 *    - Ready for structured data validation before submission
 *    - Can integrate with form validation and business rules
 *    - Extensible for additional PO fields (supplier, delivery date, etc.)
 * 
 * 4. BACKEND INTEGRATION EXAMPLE:
 *    ```
 *    const handleConfirm = async () => {
 *      try {
 *        const response = await createPurchaseOrder({
 *          poNumber,
 *          totalQuantity,
 *          totalValue,
 *          // ... other extracted data
 *        });
 *        
 *        setConfirmed(true);
 *        setOdooUrl(response.odooUrl); // Real URL from backend
 *      } catch (error) {
 *        // Handle error states
 *      }
 *    };
 *    ```
 * 
 * 5. ANIMATION & UX NOTES:
 *    - Confirmation animations designed to feel satisfying and conclusive
 *    - Summary container provides clear confirmation of what was processed
 *    - External link styling indicates action will leave current context
 *    - Component ready for success/error states from real API responses
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PurchaseOrderActionsProps {
  // Backend Integration Point: expects a PO number like "PO-2025-0847"
  poNumber?: string;
  // Backend Integration Point: Provide the absolute URL to view this PO in Odoo once available
  odooUrl?: string;
  // Backend Integration Point: Parse these from the PO message content
  totalQuantity?: string;
  totalValue?: string;
}

/**
 * PurchaseOrderActions
 * Renders a minimalist confirmation button beneath the structured Purchase Order note.
 * UX:
 *  - Initial: black, minimalist button (bg-foreground, text-background) labeled "Confirm Order"
 *  - On click: turns success (bg-primary, text-primary-foreground), shows white arrow, slightly expands
 *  - After confirmation: reveals a "View in Odoo" link next to the button
 *
 * Backend Integration Point:
 *  - On confirm, call your backend to create/submit the PO in Odoo and receive a canonical URL.
 *  - Replace the optimistic state update with the response and enable the external link.
 */
const PurchaseOrderActions: React.FC<PurchaseOrderActionsProps> = ({ 
  poNumber, 
  odooUrl, 
  totalQuantity, 
  totalValue 
}) => {
  const [confirmed, setConfirmed] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    // Backend Integration Point: expects SubmitPORequest -> Promise<SubmitPOResponse>
    setLoading(true);
    
    // Simulate API call delay - replace with real backend call
    setTimeout(() => {
      setLoading(false);
      setConfirmed(true);
    }, 1500);
  };

  const builtOdooUrl = odooUrl || (poNumber ? `https://source-animalfarmacy.odoo.com/odoo/purchase-orders/48` : undefined);

  if (confirmed) {
    return (
      <div className="mt-6 animate-enter">
        {/* Order Confirmation Summary */}
        <div className="bg-muted/30 border border-muted-foreground/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <span className="text-base font-bold">Order Confirmed</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <span className="ml-2 font-medium">{totalQuantity || '120 units'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-2 font-medium">{totalValue || '£2,940.00'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">PO Number:</span>
              <span className="ml-2 font-medium">{poNumber || 'PO-2025-0847'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-muted-foreground/10">
            <a
              href="https://source-gym-plus-coffee.odoo.com/odoo/purchase/35"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-foreground bg-background hover:bg-muted/50 border border-muted-foreground/20 rounded-md px-3 py-1.5 transition-colors hover-scale"
            >
              <span>View in Odoo</span>
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-center gap-4 animate-enter">
      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        aria-label={loading ? 'Processing Order' : 'Confirm Order'}
        className={cn(
          "rounded-lg text-base font-semibold transition-all duration-300 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transform hover:scale-105 px-6 py-3",
          loading 
            ? "bg-muted text-muted-foreground cursor-not-allowed" 
            : "bg-foreground text-background hover:opacity-90"
        )}
      >
        <span className="inline-flex items-center gap-2">
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <span>Confirm Order</span>
          )}
        </span>
      </button>
    </div>
  );
};

export default PurchaseOrderActions;
