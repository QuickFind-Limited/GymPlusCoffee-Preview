# Odoo Data Mapping Analysis - Gym+Coffee & DataCo Integration

## Executive Summary

This document provides a comprehensive mapping strategy for integrating Gym+Coffee product data (445 SKUs) and DataCo supply chain data into Odoo ERP. The analysis covers product variants, customer segmentation, inventory management, and sales order workflows.

## 1. Data Source Analysis

### 1.1 Gym+Coffee Products Dataset
- **Total SKUs**: 445 variants across 10 categories  
- **Categories**: sports-bras, joggers, t-shirts, accessories, shorts, hoodies, jackets, tops, beanies, leggings
- **Variant Structure**: Each product has color and size variants
- **Key Fields**: SKU, name, category, color, size, pricing, inventory levels

**Sample Product Structure**:
```json
{
  "sku": "GC10000-BLA-XS",
  "name": "Essential Everyday Hoodie - Black", 
  "category": "hoodies",
  "subcategory": "womens",
  "color": "Black",
  "size": "XS", 
  "list_price": 75.0,
  "standard_cost": 25.12,
  "inventory_on_hand": 52,
  "reorder_point": 28,
  "lead_time_days": 8
}
```

### 1.2 DataCo Supply Chain Dataset  
- **Customer Data**: B2B (Corporate, Home Office) and B2C (Consumer) segments
- **Order Management**: Complete order lifecycle with 9 status types
- **Geographic Distribution**: Global markets with detailed location data
- **Financial Data**: Profit analysis, discounts, pricing per order

**Key Customer Segments**:
- **Consumer**: Individual customers (B2C)
- **Corporate**: Business customers (B2B)  
- **Home Office**: Small business/remote workers (B2B)

## 2. Odoo Model Mapping Strategy

### 2.1 Product Management: Template + Variant Architecture

#### product.template (Generic Product Definition)
Maps to unique product families (e.g., "Essential Everyday Hoodie")

**Required Fields Mapping**:
```python
{
    'name': 'Essential Everyday Hoodie',  # From Gym+Coffee name (base)
    'type': 'product',  # Stockable product
    'sale_ok': True,
    'purchase_ok': False,  # Internal manufacturing
    'categ_id': category_mapping[gym_coffee_category],
    'list_price': base_list_price,  # Average/base price
    'standard_price': average_standard_cost,
    'default_code': base_sku_pattern,  # GC10000 (without variants)
    'attribute_line_ids': [
        # Color attribute line
        {
            'attribute_id': color_attribute.id,
            'value_ids': [black_value.id, grey_value.id, navy_value.id, ...]
        },
        # Size attribute line  
        {
            'attribute_id': size_attribute.id,
            'value_ids': [xs_value.id, s_value.id, m_value.id, ...]
        }
    ]
}
```

#### product.product (Specific Variants)
Each Gym+Coffee SKU becomes a product variant

**Mapping Example**:
```python
{
    'product_tmpl_id': hoodie_template.id,
    'default_code': 'GC10000-BLA-XS',  # Full SKU
    'barcode': generate_barcode(sku),
    'attribute_value_ids': [
        black_color_value.id,  # Color: Black
        xs_size_value.id       # Size: XS  
    ],
    'list_price': 75.0,  # Variant-specific price
    'standard_price': 25.12,  # Variant-specific cost
    'qty_available': 52,  # Current inventory
}
```

### 2.2 Attribute Management System

#### product.attribute (Define Characteristics)
```python
color_attribute = {
    'name': 'Color',
    'display_type': 'color',  # Visual color picker
    'variant_create_mode': 'instantly'  # Generate all combinations
}

size_attribute = {
    'name': 'Size', 
    'display_type': 'radio',  # Radio buttons
    'variant_create_mode': 'instantly'
}
```

#### product.attribute.value (Specific Values)
**Color Values**:
- Black, Grey, Navy, Green, White, Pink, Purple, etc.

**Size Values**:  
- XS, S, M, L, XL, XXL

### 2.3 Customer Management: B2B vs B2C Segmentation

#### res.partner Structure

**B2C Consumer Mapping**:
```python
{
    'name': f"{customer_fname} {customer_lname}",
    'company_type': 'person',  # Individual
    'customer_rank': 1,  # Mark as customer
    'supplier_rank': 0,
    'is_company': False,
    'street': customer_street,
    'city': customer_city, 
    'state_id': state_mapping[customer_state],
    'country_id': country_mapping[customer_country],
    'zip': customer_zipcode,
    'email': customer_email,
    'category_id': consumer_tag.id,  # B2C tag
    'property_product_pricelist': retail_pricelist.id
}
```

**B2B Corporate/Home Office Mapping**:
```python
{
    'name': generate_company_name(customer_data),
    'company_type': 'company', 
    'customer_rank': 1,
    'is_company': True,
    'street': customer_street,
    'city': customer_city,
    'state_id': state_mapping[customer_state], 
    'country_id': country_mapping[customer_country],
    'zip': customer_zipcode,
    'category_id': b2b_tag.id,  # B2B tag
    'property_product_pricelist': wholesale_pricelist.id,
    'credit_limit': calculate_credit_limit(customer_segment),
    'property_payment_term_id': b2b_payment_terms.id
}
```

### 2.4 Sales Order Workflow

#### sale.order Mapping
```python
{
    'partner_id': customer.id,
    'date_order': parse_date(dataco_order_date),
    'validity_date': date_order + timedelta(days=30),
    'state': map_order_status(dataco_status),
    'pricelist_id': customer.property_product_pricelist.id,
    'team_id': assign_sales_team(customer_segment),
    'order_line': [
        {
            'product_id': product_variant.id,
            'product_uom_qty': order_item_quantity, 
            'price_unit': order_item_product_price,
            'discount': order_item_discount_rate * 100,
            'tax_id': [(6, 0, applicable_tax_ids)]
        }
    ]
}
```

#### Order Status Mapping
```python
DATACO_TO_ODOO_STATUS = {
    'COMPLETE': 'sale',      # Confirmed sale
    'PROCESSING': 'sale',    # Confirmed, being processed
    'PENDING': 'draft',      # Draft quotation  
    'PENDING_PAYMENT': 'sent',  # Quotation sent
    'CLOSED': 'done',        # Delivered/completed
    'CANCELED': 'cancel',    # Cancelled
    'SUSPECTED_FRAUD': 'cancel',
    'ON_HOLD': 'draft',
    'PAYMENT_REVIEW': 'sent'
}
```

## 3. Data Migration Strategy

### 3.1 Migration Sequence
1. **Master Data Setup**
   - Product categories
   - Attributes and attribute values
   - Tax configurations
   - Pricelists

2. **Product Import**
   - Create product templates (one per unique product family)
   - Generate variants automatically via attributes
   - Import inventory levels

3. **Customer Import** 
   - Clean and deduplicate customer data
   - Segment by customer type
   - Apply appropriate pricelists

4. **Historical Orders**
   - Import sales orders with proper status mapping
   - Link to customers and products
   - Generate delivery orders where applicable

### 3.2 Data Quality Considerations

#### Product Data Issues
- **Duplicate SKUs**: None found in current dataset
- **Missing Attributes**: All products have color and size
- **Pricing Consistency**: Validate cost vs. list price ratios

#### Customer Data Issues  
- **Email Privacy**: DataCo emails are masked as "XXXXXXXXX"
- **Address Completeness**: Most records have complete address data
- **Name Standardization**: Need to standardize name formats

#### Order Data Issues
- **Date Formats**: Consistent MM/DD/YYYY format
- **Currency**: Assume USD (needs confirmation)
- **Tax Handling**: No tax data in source (needs business rules)

## 4. Technical Implementation Requirements

### 4.1 Required Odoo Modules
- **Sales Management** (sale)
- **Inventory Management** (stock) 
- **Product Variants** (included in sale)
- **CRM** (crm) - for customer management
- **Accounting** (account) - for invoicing

### 4.2 Custom Fields Needed

#### product.template
```python
x_gym_coffee_category = fields.Char('GC Category')
x_original_sku_pattern = fields.Char('Original SKU Pattern')
x_subcategory = fields.Selection([...])  # womens/mens/unisex
```

#### res.partner  
```python
x_customer_segment = fields.Selection([
    ('consumer', 'Consumer'),
    ('corporate', 'Corporate'), 
    ('home_office', 'Home Office')
])
x_original_customer_id = fields.Char('DataCo Customer ID')
```

### 4.3 Data Import Scripts

#### Pseudocode for Product Import
```python
def import_gym_coffee_products():
    # Group SKUs by base product (name without color/size)
    product_families = group_skus_by_family(gym_coffee_data)
    
    for family_name, variants in product_families.items():
        # Create product template
        template = create_product_template(family_name, variants[0])
        
        # Extract unique colors and sizes for this family
        colors = extract_unique_colors(variants)
        sizes = extract_unique_sizes(variants)
        
        # Set up attribute lines
        setup_attribute_lines(template, colors, sizes)
        
        # Variants are auto-generated by Odoo
        # Update variant-specific data (price, cost, inventory)
        for variant_data in variants:
            variant = find_variant_by_attributes(template, 
                                               variant_data['color'], 
                                               variant_data['size'])
            update_variant_data(variant, variant_data)
```

## 5. Validation & Testing Strategy

### 5.1 Data Validation Rules
- All products must have valid category mapping
- All variants must have both color and size attributes
- Customer addresses must have valid country/state combinations
- Order totals must match calculated values

### 5.2 Test Scenarios
- **Product Variant Creation**: Verify correct variant generation
- **Inventory Tracking**: Test stock movements per variant  
- **Customer Segmentation**: Validate B2B vs B2C workflows
- **Order Processing**: End-to-end order fulfillment
- **Reporting**: Sales analysis by customer segment and product category

## 6. Business Process Integration

### 6.1 Inventory Management
- **Reorder Points**: Use gym_coffee reorder_point data
- **Lead Times**: Map lead_time_days to procurement rules
- **Multi-location**: Consider warehouse locations based on DataCo shipping data

### 6.2 Pricing Strategy
- **Retail Pricelist**: For Consumer segment (full list price)
- **Wholesale Pricelist**: For Corporate/Home Office (volume discounts)
- **Dynamic Pricing**: Based on customer history and segment

### 6.3 Sales Process
- **Quotation Process**: Different workflows for B2B vs B2C
- **Credit Management**: Credit limits for B2B customers
- **Shipping Rules**: Based on DataCo shipping mode preferences

## 7. Inventory Management Configuration

### 7.1 Stock Tracking & Valuation
```python
# Product Configuration for Inventory
product_template_inventory_fields = {
    'type': 'product',  # Stockable product
    'tracking': 'none',  # No lot/serial tracking for apparel
    'cost_method': 'standard',  # Use standard cost from Gym+Coffee data
    'valuation': 'real_time',  # Real-time inventory valuation
    'standard_price': gym_coffee_standard_cost,
    'uom_id': uom_unit.id,  # Units
    'uom_po_id': uom_unit.id  # Same for purchase
}
```

### 7.2 Reorder Rules Integration
Map Gym+Coffee reorder points to Odoo procurement rules:
```python
{
    'product_id': product_variant.id,
    'location_id': warehouse_location.id,
    'product_min_qty': gym_coffee_reorder_point,
    'product_max_qty': reorder_point * 3,  # Business rule
    'qty_multiple': 1,
    'lead_days': gym_coffee_lead_time_days,
    'route_id': buy_route.id  # Or manufacture_route for custom products
}
```

### 7.3 Multi-Location Strategy
Based on DataCo shipping data, consider regional warehouses:
- **Main Warehouse**: Primary stock location
- **Regional DCs**: Based on DataCo shipping patterns
- **Customer Locations**: For dropshipping scenarios

### 7.4 Stock Movement Integration
```python
# Initial inventory adjustment
{
    'product_id': variant.id,
    'location_id': inventory_location.id,
    'location_dest_id': stock_location.id, 
    'product_uom_qty': gym_coffee_inventory_on_hand,
    'state': 'done'
}
```

## 8. Required Field Validation Matrix

| Model | Required Fields | Optional Fields | Custom Fields Needed |
|-------|----------------|-----------------|---------------------|
| **product.template** | name, type, uom_id, categ_id | description, sale_ok | x_gym_coffee_category, x_subcategory |
| **product.product** | product_tmpl_id, default_code | barcode, standard_price | x_original_sku |
| **product.attribute** | name, display_type | variant_create_mode | - |
| **product.attribute.value** | name, attribute_id | color (for color attributes) | - |
| **res.partner** | name, customer_rank | email, phone, street | x_customer_segment, x_dataco_id |
| **sale.order** | partner_id, date_order | validity_date, pricelist_id | x_dataco_order_id |
| **sale.order.line** | product_id, product_uom_qty | price_unit, discount | - |

## 9. Data Migration Checklist

### 9.1 Pre-Migration Setup
- [ ] Install required Odoo modules (sale, stock, crm)
- [ ] Configure company settings and fiscal year
- [ ] Set up chart of accounts
- [ ] Create product categories
- [ ] Configure taxes and fiscal positions

### 9.2 Master Data Import
- [ ] Import product attributes (Color, Size)
- [ ] Import attribute values
- [ ] Import product categories
- [ ] Create product templates (unique families)
- [ ] Generate product variants automatically
- [ ] Import customer data with segmentation
- [ ] Set up pricelists for different customer types

### 9.3 Transactional Data Import
- [ ] Import initial inventory levels
- [ ] Set up reorder rules
- [ ] Import historical sales orders (optional)
- [ ] Configure delivery methods
- [ ] Set up payment terms

### 9.4 Post-Migration Validation
- [ ] Verify variant generation (should match 445 SKUs)
- [ ] Test inventory tracking per variant
- [ ] Validate customer segmentation rules
- [ ] Test sales order workflow
- [ ] Run reporting to ensure data integrity

## 10. Business Process Recommendations

### 10.1 Inventory Optimization
- Use Gym+Coffee reorder points as baseline
- Implement ABC analysis for inventory classification  
- Set up automated procurement based on sales velocity
- Configure safety stock for fast-moving items

### 10.2 Customer Experience Enhancement
- **B2C**: Enable e-commerce with variant selection
- **B2B**: Set up customer portals with order history
- **Pricing**: Implement dynamic pricing based on quantity/customer type
- **Shipping**: Configure shipping rules based on DataCo patterns

### 10.3 Reporting & Analytics
- **Product Performance**: Sales by category, color, size
- **Customer Analysis**: Revenue by segment, geographic distribution
- **Inventory Reports**: Stock levels, turnover rates, reorder needs
- **Profitability**: Margin analysis by product and customer

## 11. Technical Integration Points

### 11.1 API Integration Requirements
```python
# External API endpoints needed
odoo_api_endpoints = {
    'products': '/api/v1/product.template',
    'variants': '/api/v1/product.product', 
    'customers': '/api/v1/res.partner',
    'orders': '/api/v1/sale.order',
    'inventory': '/api/v1/stock.quant'
}
```

### 11.2 Data Synchronization Strategy
- **Real-time**: Critical inventory and pricing updates
- **Batch**: Daily customer and order imports
- **Manual**: New product launches and seasonal updates

## 12. Risk Assessment & Mitigation

### 12.1 Data Quality Risks
- **Risk**: SKU conflicts or duplicates
- **Mitigation**: Implement validation rules and unique constraints

### 12.2 Performance Risks  
- **Risk**: Slow variant generation with 445+ SKUs
- **Mitigation**: Batch processing and background jobs

### 12.3 Business Process Risks
- **Risk**: Inventory discrepancies during migration
- **Mitigation**: Freeze inventory during cutover, reconcile afterward

## 13. Success Metrics

### 13.1 Technical KPIs
- 100% product variant accuracy (445 SKUs mapped correctly)
- <2 second product search response time
- 99.9% inventory data accuracy

### 13.2 Business KPIs
- Reduced manual order processing by 80%
- Improved inventory turnover by 15%
- Enhanced customer segmentation insights

## 14. Next Steps & Implementation Timeline

### Week 1-2: Foundation Setup
- Environment setup and module configuration
- Master data preparation and validation
- Team training and process documentation

### Week 3-4: Data Migration
- Product catalog import with variant generation
- Customer data migration with segmentation
- Historical data import (if required)

### Week 5-6: Testing & Validation
- End-to-end process testing
- User acceptance testing
- Performance optimization

### Week 7-8: Go-Live Support
- Production cutover
- Monitor system performance
- User support and issue resolution

---

**Document Status**: Complete v1.0  
**Research Coordinator**: Hive Mind Research Agent  
**Last Updated**: 2025-08-07  
**Next Review**: Post-implementation (Week 9)