
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductImage } from '@/services/productImageMapper';

interface ProductCardProps {
  id: number;
  name: string;
  image: string;
  price: string;
  minQuantity: number;
  supplier: string;
  orderChannel: string;
  reviews: number;
}

const ProductCard = React.memo(({ id, name, image, price, minQuantity, supplier, orderChannel, reviews }: ProductCardProps) => {
  const navigate = useNavigate();
  
  // Use provided image or get mapped image based on product name
  const displayImage = image || getProductImage(name);

  return (
    <div 
      className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
      onClick={() => {
        // Redirect to Odoo product page
        if (!id) return;
        
        const odooUrl = `https://source-gym-plus-coffee.odoo.com/web#id=${id}&model=product.product&view_type=form`;
        window.open(odooUrl, '_blank');
      }}
    >
      <div className="h-48 overflow-hidden">
        <img 
          src={displayImage} 
          alt={name} 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-gray-800 mb-2 text-sm line-clamp-2">{name}</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Price:</span>
            <span className="font-medium">{price}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Min Qty:</span>
            <span>{minQuantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Supplier:</span>
            <span className="truncate max-w-[80px]">{supplier}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
