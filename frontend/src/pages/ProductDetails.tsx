import React, { useState } from 'react';
import { MessageSquare, Eye, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BackButton from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";

const ProductDetails = () => {
  const thumbnails = [
    "/lovable-uploads/a25deb07-bdcd-40e4-a79f-6afecbdd777e.png",
    "/lovable-uploads/5b596d50-da50-4030-9d26-bf381e82a36c.png",
    "/lovable-uploads/6ea6ab0b-4930-4303-80da-a1685b15c2f3.png",
    "/lovable-uploads/90aa2a49-82df-4998-97ee-c77b558cf526.png",
    "/lovable-uploads/ee5a6158-0f47-49b2-808f-02c56bc0f8d9.png"
  ];

  const [selectedImage, setSelectedImage] = useState(thumbnails[0]);
  
  // Format currency function
  const formatCurrency = (value?: number) => {
    if (value === undefined) return '£0';
    return `£${value.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <BackButton to="/dashboard" className="mr-3" />
            <h1 className="text-xl font-semibold">Product Details</h1>
          </div>
          <UserRound className="h-6 w-6 text-orange-500 cursor-pointer" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col md:flex-row h-full">
            <div className="flex flex-row md:flex-col gap-2 md:mr-4 mb-4 md:mb-0">
              {thumbnails.map((thumb, idx) => (
                <div 
                  key={idx} 
                  className={`w-12 md:w-16 h-16 md:h-20 rounded-md overflow-hidden border cursor-pointer ${selectedImage === thumb ? 'border-brand-500' : 'hover:border-brand-500'}`}
                  onClick={() => setSelectedImage(thumb)}
                >
                  <img src={thumb} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            
            <div className="flex-grow flex flex-col h-full">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex-grow">
                <img
                  src={selectedImage}
                  alt="Floral Back Tie Tiered Mini Dress"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="border rounded-lg p-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex justify-center items-center">
                    <img 
                      src="/lovable-uploads/a9fe6291-ad62-4a09-b635-c551a2d05dc6.png" 
                      alt="Ynique logo" 
                      className="h-3 object-contain" 
                    />
                  </div>
                  
                  <div className="flex justify-center items-center">
                    <img 
                      src="/lovable-uploads/1419346a-c4b9-4c20-b223-7e89dc95dc95.png" 
                      alt="Faire logo" 
                      className="h-24 object-contain" 
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">Supplier Details</h3>
                    <p className="text-sm">Name: Ynique</p>
                    <p className="text-sm">Location: France</p>
                    <p className="text-sm">Shipping: From Faire</p>
                    <p className="text-sm">Rating: 4.8 ★ (28)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Floral Back Tie Tiered Mini Dress</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Color</label>
                <Select defaultValue="green">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Quantity</label>
                <Select defaultValue="6">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select quantity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 pieces</SelectItem>
                    <SelectItem value="12">12 pieces</SelectItem>
                    <SelectItem value="18">18 pieces</SelectItem>
                    <SelectItem value="24">24 pieces</SelectItem>
                    <SelectItem value="30">30 pieces</SelectItem>
                    <SelectItem value="36">36 pieces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <h3 className="text-sm text-gray-500">Department</h3>
                <p>Women's Clothing</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Category</h3>
                <p>Dresses</p>
              </div>
            </div>

            <button className="w-full bg-brand-500 text-white py-3 rounded-lg hover:bg-brand-600 transition-colors">
              Update Order
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center space-x-2 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
                <MessageSquare className="h-4 w-4" />
                <span>Message Supplier</span>
              </button>
              <button className="flex items-center justify-center space-x-2 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
                <Eye className="h-4 w-4" />
                <span>Add to Watch List</span>
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Product Description</h3>
              <p className="text-gray-600">
                Add a touch of whimsy to your wardrobe with this adorable mini dress, featuring a feminine floral pattern, ruffled details, and a tiered design that creates a playful, flowy silhouette. With a ruched bust, tie strap detail, and back cut-out, this sleeveless dress is a stylish and eye-catching choice for a night out or special occasion.
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Product Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-gray-500">Made in</h4>
                  <p>China</p>
                </div>
                <div>
                  <h4 className="text-gray-500">Care Instructions</h4>
                  <p>Hand wash</p>
                </div>
                <div>
                  <h4 className="text-gray-500">Fabric</h4>
                  <p>100% Polyester</p>
                </div>
                <div>
                  <h4 className="text-gray-500">Season</h4>
                  <p>Spring/Summer</p>
                </div>
                <div>
                  <h4 className="text-gray-500">Weight</h4>
                  <p>200 g (7.05 oz)</p>
                </div>
                <div>
                  <h4 className="text-gray-500">Dimensions</h4>
                  <p>33 x 21 x 1 cm (13 x 8.3 x 0.4 in)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
