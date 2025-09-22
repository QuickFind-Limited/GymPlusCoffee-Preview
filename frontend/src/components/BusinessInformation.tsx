
import React, { useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BusinessInformationProps {
  onSubmit: (data: any) => void;
}

const countries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "India",
  "Brazil",
  // Add more countries as needed
];

const BusinessInformation: React.FC<BusinessInformationProps> = ({ onSubmit }) => {
  const formRef = useRef<HTMLFormElement>(null);

  // This function will be called by the parent component
  React.useEffect(() => {
    // Add submit button to the parent's fixed footer
    const footerButton = document.querySelector(".fixed.bottom-0 .flex.justify-end");
    
    if (footerButton && !footerButton.querySelector("button")) {
      const submitButton = document.createElement("button");
      submitButton.textContent = "Continue";
      submitButton.className = "bg-brand-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-600 transition-colors";
      submitButton.addEventListener("click", () => {
        if (formRef.current) {
          const formData = new FormData(formRef.current);
          onSubmit(Object.fromEntries(formData.entries()));
        }
      });
      
      footerButton.appendChild(submitButton);
      
      // Clean up when component unmounts
      return () => {
        if (submitButton && submitButton.parentNode === footerButton) {
          footerButton.removeChild(submitButton);
        }
      };
    }
  }, [onSubmit]);

  return (
    <form ref={formRef} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <Label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</Label>
            <Select name="country">
              <SelectTrigger id="country" className="w-full">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">Legal business name</Label>
            <Input
              id="businessName"
              name="businessName"
              placeholder="Enter your business name"
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="businessWebsite" className="block text-sm font-medium text-gray-700 mb-1">Business website</Label>
            <Input
              id="businessWebsite"
              name="businessWebsite"
              placeholder="www.yourcompany.com"
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-1">Business number</Label>
            <Input
              id="businessNumber"
              name="businessNumber"
              placeholder="Enter your business number"
              className="w-full"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <Label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">Account Name</Label>
            <Input
              id="accountName"
              name="accountName"
              placeholder="Enter account name"
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">Account Number</Label>
            <Input
              id="accountNumber"
              name="accountNumber"
              placeholder="Enter account number"
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="swiftBic" className="block text-sm font-medium text-gray-700 mb-1">SWIFT/BIC</Label>
            <Input
              id="swiftBic"
              name="swiftBic"
              placeholder="Enter SWIFT/BIC code"
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">IBAN</Label>
            <Input
              id="iban"
              name="iban"
              placeholder="Enter IBAN"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default BusinessInformation;
