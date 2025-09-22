/**
 * Product Image Mapper Service
 * Maps product names/types to local images since Odoo doesn't store images
 */

// Available product images in public/lovable-uploads
const productImages = {
  // Hoodies
  hoodie: [
    '/lovable-uploads/a9fe6291-ad62-4a09-b635-c551a2d05dc6.png',
    '/lovable-uploads/5b596d50-da50-4030-9d26-bf381e82a36c.png',
    '/lovable-uploads/46a8e3e8-6d0d-4697-81bf-aebb8b79a19e.png',
  ],
  // T-shirts and Tees
  tee: [
    '/lovable-uploads/90aa2a49-82df-4998-97ee-c77b558cf526.png',
    '/lovable-uploads/49d56a4d-3453-48c6-bd26-2ba59b436142.png',
    '/lovable-uploads/eae07338-87ef-485f-948b-9baac3389dba.png',
  ],
  shirt: [
    '/lovable-uploads/90aa2a49-82df-4998-97ee-c77b558cf526.png',
    '/lovable-uploads/49d56a4d-3453-48c6-bd26-2ba59b436142.png',
  ],
  // Leggings and Pants
  leggings: [
    '/lovable-uploads/ee5a6158-0f47-49b2-808f-02c56bc0f8d9.png',
    '/lovable-uploads/a25deb07-bdcd-40e4-a79f-6afecbdd777e.png',
  ],
  pants: [
    '/lovable-uploads/ee5a6158-0f47-49b2-808f-02c56bc0f8d9.png',
    '/lovable-uploads/a25deb07-bdcd-40e4-a79f-6afecbdd777e.png',
  ],
  // Shorts
  shorts: [
    '/lovable-uploads/98ffbd50-bb80-442b-9d2f-47db14c682e5.png',
    '/lovable-uploads/003574a6-9c3e-4ef7-b388-4787c2f0f6a2.png',
  ],
  // Jackets
  jacket: [
    '/lovable-uploads/46a8e3e8-6d0d-4697-81bf-aebb8b79a19e.png',
    '/lovable-uploads/5b596d50-da50-4030-9d26-bf381e82a36c.png',
  ],
  // Shoes and Boots
  shoe: [
    '/lovable-uploads/180d7dec-c110-4413-8c0d-580b73dffedb.png',
  ],
  boot: [
    '/lovable-uploads/180d7dec-c110-4413-8c0d-580b73dffedb.png',
  ],
  // Accessories
  beanie: [
    '/lovable-uploads/5e5d8252-fe38-4b94-b7b1-3d8a89600a54.png',
    '/lovable-uploads/269b1c3e-0693-4bd7-843e-e853d37b3e0a.png',
  ],
  cap: [
    '/lovable-uploads/1b305c23-bc7d-4fb1-94d3-1732379b25dd.png',
    '/lovable-uploads/2286e440-2796-4957-8be7-2795bd630d1d.png',
  ],
  hat: [
    '/lovable-uploads/1b305c23-bc7d-4fb1-94d3-1732379b25dd.png',
  ],
  bottle: [
    '/lovable-uploads/6ea6ab0b-4930-4303-80da-a1685b15c2f3.png',
    '/lovable-uploads/706d6769-061e-4b18-91ab-25c377db66f6.png',
  ],
  socks: [
    '/lovable-uploads/253f7914-95dc-4817-a80e-b1ece852d561.png',
    '/lovable-uploads/554cd914-e6c8-4a99-a2d7-d4b44a96cfe9.png',
  ],
  bag: [
    '/lovable-uploads/c01d99aa-e83d-4d4b-baf5-c451a0d3ac4d.png',
    '/lovable-uploads/d24004d6-3d5f-4eda-8981-c91f8e91904b.png',
  ],
  // Jewelry
  jewelry: [
    '/lovable-uploads/7c27528a-b2dd-4f35-90c2-b1aace1200ea.png',
  ],
  necklace: [
    '/lovable-uploads/7c27528a-b2dd-4f35-90c2-b1aace1200ea.png',
  ],
  // Wine and beverages
  wine: [
    '/lovable-uploads/ece5d739-6092-4e95-a923-e4372626177e.png',
  ],
  // Home decor
  mirror: [
    '/lovable-uploads/183882eb-50f4-4541-924c-22cbf9aa291e.png',
  ],
  // Beauty products
  cream: [
    '/lovable-uploads/04e1c43b-f6da-4eae-bb7d-fd5581abaa50.png',
  ],
  oil: [
    '/lovable-uploads/04e1c43b-f6da-4eae-bb7d-fd5581abaa50.png',
  ],
};

// Fallback images for categories
const categoryImages = {
  'Clothing': '/lovable-uploads/a9fe6291-ad62-4a09-b635-c551a2d05dc6.png',
  'Accessories': '/lovable-uploads/7c27528a-b2dd-4f35-90c2-b1aace1200ea.png',
  'Footwear': '/lovable-uploads/180d7dec-c110-4413-8c0d-580b73dffedb.png',
  'Sports': '/lovable-uploads/6ea6ab0b-4930-4303-80da-a1685b15c2f3.png',
  'Home': '/lovable-uploads/183882eb-50f4-4541-924c-22cbf9aa291e.png',
};

// Default fallback image
const defaultProductImage = '/lovable-uploads/a9fe6291-ad62-4a09-b635-c551a2d05dc6.png';

/**
 * Get an appropriate image for a product based on its name and type
 * @param productName - The name of the product
 * @param productType - Optional product type/category
 * @returns URL to an appropriate product image
 */
export function getProductImage(productName: string, productType?: string | null): string {
  if (!productName) return defaultProductImage;
  
  const nameLower = productName.toLowerCase();
  const typeLower = productType?.toLowerCase() || '';
  
  // Check product name for keywords
  for (const [keyword, images] of Object.entries(productImages)) {
    if (nameLower.includes(keyword) || typeLower.includes(keyword)) {
      // Use consistent image based on product ID/name hash for consistency
      const hash = productName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return images[hash % images.length];
    }
  }
  
  // Check category fallbacks
  for (const [category, image] of Object.entries(categoryImages)) {
    if (typeLower.includes(category.toLowerCase())) {
      return image;
    }
  }
  
  // Return default image
  return defaultProductImage;
}

/**
 * Get multiple product images for a product (for gallery view)
 * @param productName - The name of the product
 * @param productType - Optional product type/category
 * @returns Array of image URLs
 */
export function getProductImages(productName: string, productType?: string | null): string[] {
  const primaryImage = getProductImage(productName, productType);
  
  // For now, return just the primary image
  // In future, could return multiple images for gallery
  return [primaryImage];
}

/**
 * Check if a product has a custom image or uses default mapping
 * @param imageUrl - The current image URL
 * @returns boolean indicating if it's a custom image
 */
export function hasCustomImage(imageUrl?: string | null): boolean {
  if (!imageUrl) return false;
  
  // Check if it's one of our mapped images
  const allMappedImages = [
    ...Object.values(productImages).flat(),
    ...Object.values(categoryImages),
    defaultProductImage,
  ];
  
  return !allMappedImages.includes(imageUrl);
}