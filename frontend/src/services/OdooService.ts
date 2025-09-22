import { supabase, supabaseUrl, supabaseAnonKey } from '@/integrations/supabase/client';
import { Logger } from './Logger';

export interface OdooPurchaseOrder {
  id?: number;
  name?: string;
  partner_id?: number;
  partner_name?: string;
  date_order: string;
  state: 'draft' | 'sent' | 'to_approve' | 'purchase' | 'done' | 'cancel';
  order_line: OdooPurchaseOrderLine[] | number[];
  amount_total: number;
  amount_untaxed: number;
  amount_tax: number;
  currency_id?: number;
  company_id?: number;
}

export interface OdooPurchaseOrderLine {
  id?: number;
  product_id: number;
  product_name?: string;
  name: string;
  product_qty: number;
  product_uom?: number | string;
  price_unit: number;
  price_subtotal: number;
  price_total: number;
  taxes_id?: number[];
  date_planned?: string;
}

export class OdooService {
  async fetchPurchaseOrders(): Promise<OdooPurchaseOrder[]> {
    try {
      Logger.debug('Fetching purchase orders from Odoo...');
      
      // Try direct fetch first to debug
      const directResponse = await fetch(`${supabaseUrl}/functions/v1/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-application-name': 'animal-farmacy',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          method: 'search_read',
          model: 'purchase.order',
          fields: [
            'id', 'name', 'state', 'date_order', 'amount_total', 
            'amount_untaxed', 'amount_tax'
          ],
          limit: 100,
          order: 'date_order desc'
        })
      });
      
      if (!directResponse.ok) {
        throw new Error(`HTTP ${directResponse.status}: ${await directResponse.text()}`);
      }
      
      const data = await directResponse.json();
      Logger.debug('Direct fetch response:', { ordersCount: data?.orders?.length || 0 });
      
      if (!data) throw new Error('No data received');
      
      // Process the orders with simplified data
      const orders = data?.orders || [];
      
      // Process orders
      const processedOrders = orders.map((order: any) => {
        return {
          ...order,
          partner_name: '',
          partner_id: 0,
          order_line: []
        };
      });
      
      return processedOrders;
    } catch (error) {
      Logger.error('Failed to fetch purchase orders', error as Error);
      throw error;
    }
  }
  
  async createPurchaseOrder(order: Partial<OdooPurchaseOrder>): Promise<number> {
    try {
      Logger.debug('Creating purchase order', { partnerId: order.partner_id, linesCount: order.order_line?.length || 0 });
      
      // Prepare order data for Odoo - send simple format, let edge function transform
      // Format date for Odoo: YYYY-MM-DD HH:MM:SS
      const now = new Date();
      const dateOrder = order.date_order ? new Date(order.date_order) : now;
      const formattedDate = `${dateOrder.getFullYear()}-${String(dateOrder.getMonth() + 1).padStart(2, '0')}-${String(dateOrder.getDate()).padStart(2, '0')} ${String(dateOrder.getHours()).padStart(2, '0')}:${String(dateOrder.getMinutes()).padStart(2, '0')}:${String(dateOrder.getSeconds()).padStart(2, '0')}`;
      
      const orderData = {
        partner_id: order.partner_id,
        date_order: formattedDate,
        order_line: order.order_line || []
      };
      
      Logger.debug('Sending order data to edge function', { dateOrder: orderData.date_order });
      
      // Create the purchase order via edge function
      Logger.debug('Calling purchase-orders edge function');
      
      // Use direct fetch for now to bypass Supabase client issues
      const response = await fetch(`${supabaseUrl}/functions/v1/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-application-name': 'animal-farmacy',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          method: 'create',
          model: 'purchase.order',
          data: orderData
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('Edge function error', { status: response.status, error: errorText });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      Logger.debug('Purchase order created', { orderId: data?.id });
      
      if (data.error) {
        Logger.error('Odoo API error', { error: data.error, details: data.details });
        throw new Error(`Odoo error: ${data.error}\nDetails: ${data.details || 'None'}`);
      }
      
      const orderId = data?.id;
      if (!orderId) throw new Error('Failed to get order ID from Odoo');
      
      // Optionally confirm the order
      if (order.state === 'purchase') {
        await supabase.functions.invoke('odoo', {
          body: {
            method: 'button_confirm',
            model: 'purchase.order',
            ids: [orderId]
          }
        });
      }
      
      return orderId;
    } catch (error) {
      Logger.error('Failed to create purchase order', error as Error);
      throw error;
    }
  }
  
  async updatePurchaseOrder(id: number, updates: Partial<OdooPurchaseOrder>): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (updates.partner_id) updateData.partner_id = updates.partner_id;
      if (updates.date_order) updateData.date_order = updates.date_order;
      
      // Handle order lines updates
      if (updates.order_line) {
        updateData.order_line = updates.order_line.map(line => {
          if (line.id) {
            // Update existing line
            return [1, line.id, {
              product_id: line.product_id,
              name: line.name,
              product_qty: line.product_qty,
              price_unit: line.price_unit
            }];
          } else {
            // Create new line
            return [0, 0, {
              product_id: line.product_id,
              name: line.name,
              product_qty: line.product_qty,
              price_unit: line.price_unit
            }];
          }
        });
      }
      
      const { data, error } = await supabase.functions.invoke('odoo', {
        body: {
          method: 'write',
          model: 'purchase.order',
          ids: [id],
          data: updateData
        }
      });
      
      if (error) throw error;
      
      return data?.success || false;
    } catch (error) {
      Logger.error('Failed to update purchase order', error as Error);
      throw error;
    }
  }
  
  async getSuppliers(): Promise<Array<{ id: number; name: string }>> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-application-name': 'animal-farmacy',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          method: 'search_read',
          model: 'res.partner',
          domain: [['supplier_rank', '>', 0]],
          fields: ['id', 'name'],
          limit: 200,
          order: 'name'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      return data?.partners || [];
    } catch (error) {
      Logger.error('Failed to fetch suppliers', error as Error);
      throw error;
    }
  }

  async getSupplierById(supplierId: number): Promise<{
    id: number;
    name: string;
    email?: string;
    street?: string;
    street2?: string;
    city?: string;
    state_id?: [number, string];
    zip?: string;
    country_id?: [number, string];
    phone?: string;
    vat?: string;
  } | null> {
    try {
      Logger.debug('Fetching supplier details for ID:', { supplierId });
      
      const response = await fetch(`${supabaseUrl}/functions/v1/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-application-name': 'animal-farmacy',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          method: 'read',
          model: 'res.partner',
          ids: [supplierId],
          fields: [
            'id', 'name', 'email', 'street', 'street2', 
            'city', 'state_id', 'zip', 'country_id', 
            'phone', 'vat'
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      Logger.debug('Supplier details response:', data);
      
      if (data && Array.isArray(data) && data.length > 0) {
        return data[0];
      }
      
      return null;
    } catch (error) {
      Logger.error('Failed to fetch supplier details', error as Error);
      return null; // Return null on error to allow fallback
    }
  }

  async getSupplierByName(supplierName: string): Promise<{
    id: number;
    name: string;
    email?: string;
    street?: string;
    street2?: string;
    city?: string;
    state_id?: [number, string];
    zip?: string;
    country_id?: [number, string];
    phone?: string;
    vat?: string;
  } | null> {
    try {
      Logger.debug('Fetching supplier by name:', { supplierName });
      
      // For now, hardcode known suppliers until edge function search_read is fixed
      const knownSuppliers: Record<string, number> = {
        'FastPet Logistics': 25,
        'European Pet Distributors': 23,
        'Global Pet Supplies': 21,
        'Natural Pet Solutions': 26,
        'PetMeds Direct': 20,
        'Premium Pet Products Co': 24,
        'Veterinary Wholesale Inc': 22
      };
      
      const supplierId = knownSuppliers[supplierName];
      if (supplierId) {
        // Use the working read method instead
        return await this.getSupplierById(supplierId);
      }
      
      // Try search_read anyway in case it starts working
      const response = await fetch(`${supabaseUrl}/functions/v1/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-application-name': 'animal-farmacy',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          method: 'search_read',
          model: 'res.partner',
          domain: [
            ['supplier_rank', '>', 0],
            ['name', 'ilike', supplierName]
          ],
          fields: [
            'id', 'name', 'email', 'street', 'street2', 
            'city', 'state_id', 'zip', 'country_id', 
            'phone', 'vat'
          ],
          limit: 1
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      Logger.debug('Supplier search response:', data);
      
      if (data?.partners && data.partners.length > 0) {
        return data.partners[0];
      }
      
      return null;
    } catch (error) {
      Logger.error('Failed to fetch supplier by name', error as Error);
      return null; // Return null on error to allow fallback
    }
  }
  
  async getProducts(): Promise<Array<{ id: number; name: string; code: string }>> {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-application-name': 'animal-farmacy',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          method: 'search_read',
          model: 'product.product',
          domain: [['purchase_ok', '=', true]],
          fields: ['id', 'name', 'default_code'],
          limit: 500,
          order: 'name'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      return (data?.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.default_code || ''
      }));
    } catch (error) {
      Logger.error('Failed to fetch products', error as Error);
      throw error;
    }
  }
  
  async fetchOrderDetails(orderId: number): Promise<{ partner_id?: [number, string], order_line?: number[] } | null> {
    // Due to Odoo API limitations, partner_id and order_line fields cannot be fetched
    // This would need to be resolved on the Odoo server configuration
    Logger.debug(`Unable to fetch partner/line details for order ${orderId} due to API limitations`);
    return null;
  }
  
  async attachDocumentToPurchaseOrder(orderId: number, fileName: string, base64Data: string): Promise<number> {
    try {
      Logger.debug('Attaching document to purchase order', { orderId, fileName });
      
      const response = await fetch(`${supabaseUrl}/functions/v1/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-application-name': 'animal-farmacy',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          method: 'create',
          model: 'ir.attachment',
          data: {
            name: fileName,
            datas: base64Data,
            res_model: 'purchase.order',
            res_id: orderId,
            mimetype: 'application/pdf',
            type: 'binary'
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('Failed to attach document', { status: response.status, error: errorText });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      Logger.debug('Document attached successfully', { attachmentId: data?.id });
      
      if (data.error) {
        Logger.error('Odoo API error', { error: data.error, details: data.details });
        throw new Error(`Odoo error: ${data.error}\nDetails: ${data.details || 'None'}`);
      }
      
      const attachmentId = data?.id;
      if (!attachmentId) throw new Error('Failed to get attachment ID from Odoo');
      
      return attachmentId;
    } catch (error) {
      Logger.error('Failed to attach document to purchase order', error as Error);
      throw error;
    }
  }

  async enrichOrdersWithDetails(orders: OdooPurchaseOrder[]): Promise<OdooPurchaseOrder[]> {
    Logger.debug('Enriching orders with details...');
    
    // Fetch partner details for each order in parallel
    const enrichmentPromises = orders.map(async (order) => {
      if (order.id) {
        Logger.debug(`Fetching details for order ${order.id}...`);
        const details = await this.fetchOrderDetails(order.id);
        Logger.debug(`Details retrieved for order ${order.id}`, { hasDetails: !!details });
        
        if (details) {
          return {
            ...order,
            partner_id: Array.isArray(details.partner_id) ? details.partner_id[0] : 0,
            partner_name: Array.isArray(details.partner_id) ? details.partner_id[1] : 'Unknown Supplier',
            order_line: details.order_line || []
          };
        }
      }
      return order;
    });
    
    const enrichedOrders = await Promise.all(enrichmentPromises);
    Logger.debug('Enriched orders:', enrichedOrders);
    return enrichedOrders;
  }
  
  async fetchOrderLines(lineIds: number[]): Promise<OdooPurchaseOrderLine[]> {
    try {
      if (!lineIds || lineIds.length === 0) return [];
      
      Logger.debug('Fetching order lines from Odoo:', lineIds);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'x-application-name': 'animal-farmacy',
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          method: 'read',
          model: 'purchase.order.line',
          ids: lineIds,
          fields: [
            'id', 'product_id', 'name', 'product_qty', 
            'price_unit', 'price_subtotal', 'price_total',
            'product_uom', 'date_planned'
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const data = await response.json();
      Logger.debug('Order lines response:', data);
      
      const lines = data?.lines || [];
      
      // Process the lines to extract product information
      return lines.map((line: any) => ({
        id: line.id,
        product_id: Array.isArray(line.product_id) ? line.product_id[0] : line.product_id,
        product_name: Array.isArray(line.product_id) ? line.product_id[1] : '',
        name: line.name || '',
        product_qty: line.product_qty || 0,
        price_unit: line.price_unit || 0,
        price_subtotal: line.price_subtotal || 0,
        price_total: line.price_total || 0,
        product_uom: Array.isArray(line.product_uom) ? line.product_uom[1] : 'Unit(s)',
        date_planned: line.date_planned
      }));
    } catch (error) {
      Logger.error('Failed to fetch order lines:', error);
      throw error;
    }
  }
}