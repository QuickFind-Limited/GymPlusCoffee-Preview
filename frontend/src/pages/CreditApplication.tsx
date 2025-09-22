import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, CheckCircle, X, Loader } from 'lucide-react';
import BusinessInformation from '@/components/BusinessInformation';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import BackButton from "@/components/ui/back-button";

const CreditApplication: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [purchaseValue, setPurchaseValue] = useState(750000);
  const [netTerms, setNetTerms] = useState<'60' | '90'>('90');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProgressSpinner, setShowProgressSpinner] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  const calculateRevolvingLOC = () => {
    if (netTerms === '60') {
      return Math.round(purchaseValue * 3 * (5/9));
    } else {
      return Math.round(purchaseValue * 3 * (8/9));
    }
  };
  
  const getCreditPeriod = () => {
    return netTerms === '60' ? 60 : 90;
  };
  
  const calculateCostOfCredit = () => {
    const revolvingLOCValue = calculateRevolvingLOC();
    if (netTerms === '60') {
      return Math.round(revolvingLOCValue * 0.03 * (5/9));
    } else {
      return Math.round(revolvingLOCValue * 0.03 * (8/9));
    }
  };
  
  const revolvingLOC = calculateRevolvingLOC();
  const monthlyFeeAmount = Math.round(revolvingLOC * 0.01);
  const costOfCredit = calculateCostOfCredit();
  const creditPeriod = getCreditPeriod();
  const effectiveAnnualRate = 12.68;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const handlePurchaseValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPurchaseValue(Number(e.target.value));
  };

  const handleNetTermsChange = (value: '60' | '90') => {
    setNetTerms(value);
  };
  
  const handleContinue = () => {
    setCurrentStep(2);
  };
  
  const handleBusinessInfoSubmit = (data: any) => {
    console.log('Business Information:', data);
    setCurrentStep(3);
  };
  
  const handleAcceptTerms = () => {
    if (!termsAccepted) return;
    
    setIsSubmitting(true);
    setShowProgressSpinner(true);
    
    console.log('Showing spinner:', showProgressSpinner);
    
    toast.info("Processing your credit request...");
    
    setTimeout(() => {
      console.log('Timeout completed, hiding spinner');
      setIsSubmitting(false);
      setShowProgressSpinner(false);
      setShowApprovalModal(true);
    }, 4000);
  };
  
  const handleStartOrdering = () => {
    setShowApprovalModal(false);
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <BackButton />
            <h1 className="text-xl font-bold">Credit</h1>
          </div>
          
          <div className="bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
            <UserRound className="h-5 w-5 text-gray-600" />
          </div>
        </div>
      </header>
      
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className={`${currentStep >= 1 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'} rounded-full w-8 h-8 flex items-center justify-center font-medium`}>
                1
              </div>
              <span className={`text-sm font-medium mt-1 ${currentStep >= 1 ? 'text-brand-500' : 'text-gray-500'}`}>Net Terms</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className={`${currentStep >= 2 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'} rounded-full w-8 h-8 flex items-center justify-center font-medium`}>
                2
              </div>
              <span className={`text-sm font-medium mt-1 ${currentStep >= 2 ? 'text-brand-500' : 'text-gray-500'}`}>Business Information</span>
            </div>
            <div className="flex-1 h-px bg-gray-200 mx-4"></div>
            <div className="flex flex-col items-center">
              <div className={`${currentStep >= 3 ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-500'} rounded-full w-8 h-8 flex items-center justify-center font-medium`}>
                3
              </div>
              <span className={`text-sm font-medium mt-1 ${currentStep >= 3 ? 'text-brand-500' : 'text-gray-500'}`}>Agreement</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 py-8 px-6 pb-24">
        {currentStep === 1 && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Monthly Procurement Spend</h2>
                <div className="text-4xl font-bold mb-6">{formatCurrency(purchaseValue)}</div>
                
                <div className="mb-2">
                  <input
                    type="range"
                    min="100000"
                    max="2000000"
                    step="50000"
                    value={purchaseValue}
                    onChange={handlePurchaseValueChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <span>$100,000</span>
                  <span>$2,000,000</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">What Net terms would you like?</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleNetTermsChange('60')}
                    className={`border rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${
                      netTerms === '60' 
                        ? 'border-brand-500 bg-brand-50 text-brand-700' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg font-bold">60-days</span>
                  </button>
                  
                  <button
                    onClick={() => handleNetTermsChange('90')}
                    className={`border rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${
                      netTerms === '90' 
                        ? 'border-brand-500 bg-brand-50 text-brand-700' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg font-bold">90-days</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Revolving LOC Required</span>
                  <span className="font-bold text-xl">{formatCurrency(revolvingLOC)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Credit Period</span>
                  <span className="font-bold">{creditPeriod} days</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Net Terms</span>
                  <span className="font-bold">Net-{netTerms}</span>
                </div>
                
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Rate</span>
                    <span className="font-bold text-xl">1%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Effective Annual Rate</span>
                  <span className="font-bold text-xl">{effectiveAnnualRate}%</span>
                </div>
                
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Cost of Credit</span>
                    <span className="font-bold text-xl">{formatCurrency(costOfCredit)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="max-w-7xl mx-auto">
            <BusinessInformation onSubmit={handleBusinessInfoSubmit} />
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Credit Agreement Terms and Conditions</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-h-96 overflow-y-auto mb-6">
                <div className="space-y-6 text-gray-700">
                  <div>
                    <h3 className="font-bold mb-2">1. Definitions</h3>
                    <p>For purposes of this Agreement, the following terms shall have the meanings given below:</p>
                    <ul className="list-disc pl-8 mt-2 space-y-1">
                      <li>"Credit Facility" means the revolving line of credit provided by Lender to Borrower, up to an aggregate amount of [Credit Limit].</li>
                      <li>"Draw" means any amount withdrawn by Borrower under the Credit Facility.</li>
                      <li>"Net 90 Payment Terms" means that each Draw, together with accrued interest and applicable fees, shall be repaid in full on the 90th day following the date of the Draw.</li>
                      <li>"Supplier Invoices" means invoices received by Borrower from its suppliers for goods or services provided.</li>
                      <li>"Interest Period" means the period commencing on the date of each Draw and ending on the Net 90 Maturity Date for that Draw.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">2. Credit Facility and Borrowing</h3>
                    <p className="font-medium">2.1 Commitment.</p>
                    <p>Lender agrees to make available to Borrower a revolving line of credit (the "Credit Facility") with an aggregate principal amount not to exceed [Credit Limit].</p>
                    
                    <p className="font-medium mt-2">2.2 Borrowing.</p>
                    <ul className="list-disc pl-8 mt-2 space-y-1">
                      <li>Borrower may request Draws up to the available limit by submitting a written "Notice of Draw" that specifies the amount to be advanced.</li>
                      <li>Each Draw will be treated as a separate loan subject to the terms herein.</li>
                    </ul>
                    
                    <p className="font-medium mt-2">2.3 Purpose.</p>
                    <p>Borrower shall use the funds solely for paying Supplier Invoices and meeting working capital requirements, thereby effectively simulating net 90‑day payment terms with its suppliers.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">3. Net 90 Payment Simulation</h3>
                    <p className="font-medium">3.1 Maturity Date for Each Draw.</p>
                    <p>Each Draw shall mature on the 90th day ("Net 90 Maturity Date") following its issuance. The Borrower agrees to repay each Draw (plus accrued interest and fees) in full on or before its respective Net 90 Maturity Date.</p>
                    
                    <p className="font-medium mt-2">3.2 Repayment Application.</p>
                    <p>Repayments received shall be applied to the outstanding principal of the Draw, followed by accrued interest and any applicable fees.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">4. Interest and Fees</h3>
                    <p className="font-medium">4.1 Interest Rate.</p>
                    <ul className="list-disc pl-8 mt-2 space-y-1">
                      <li>Interest shall accrue on each outstanding Draw at an annual rate of [X]% (calculated on a daily basis using a [360/365]-day year).</li>
                      <li>Interest for each Draw will be computed from the date of the Draw until the Net 90 Maturity Date.</li>
                    </ul>
                    
                    <p className="font-medium mt-2">4.2 Commitment Fee.</p>
                    <p>A commitment fee of [Y]% per annum may be charged on any unused portion of the Credit Facility, payable [monthly/quarterly].</p>
                    
                    <p className="font-medium mt-2">4.3 Late Payment Fee.</p>
                    <p>If a Draw is not repaid by its Net 90 Maturity Date, a late fee of [Z]% per month on the overdue amount shall apply until full payment is received.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">5. Repayment and Prepayment</h3>
                    <p className="font-medium">5.1 Scheduled Repayment.</p>
                    <p>Borrower shall repay each Draw in full on or before its Net 90 Maturity Date.</p>
                    
                    <p className="font-medium mt-2">5.2 Prepayment.</p>
                    <p>Borrower may prepay any outstanding Draw, in whole or in part, without penalty. Prepayments will first reduce accrued interest and fees, then the principal.</p>
                    
                    <p className="font-medium mt-2">5.3 Payment Method.</p>
                    <p>All payments shall be made by wire transfer, check, or another method mutually agreed upon by the Parties.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">6. Conditions Precedent</h3>
                    <p className="font-medium">6.1 Documentation.</p>
                    <p>Prior to accessing the Credit Facility, Borrower shall provide:</p>
                    <ul className="list-disc pl-8 mt-2 space-y-1">
                      <li>Evidence of its operational and financial status (e.g., financial statements, proof of business registration).</li>
                      <li>Any additional documents reasonably required by Lender.</li>
                    </ul>
                    
                    <p className="font-medium mt-2">6.2 Ongoing Reporting.</p>
                    <p>Borrower shall furnish periodic financial updates (e.g., quarterly financial statements) to Lender, to demonstrate continued creditworthiness.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">7. Representations and Warranties</h3>
                    <p>Borrower represents and warrants that:</p>
                    <ul className="list-disc pl-8 mt-2 space-y-1">
                      <li>It is duly organized, validly existing, and in good standing under the laws of its jurisdiction.</li>
                      <li>It has the authority to enter into and perform this Agreement.</li>
                      <li>All information provided to Lender is true and complete.</li>
                      <li>The funds borrowed will be used exclusively for paying Supplier Invoices and supporting its working capital needs.</li>
                    </ul>
                    <p className="mt-2">Lender represents that it has the authority to extend the Credit Facility and is not in violation of any applicable law or regulation.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">8. Covenants</h3>
                    <p className="font-medium">8.1 Use of Funds.</p>
                    <p>Borrower shall use the funds solely for the purposes set forth in Section 2.3 and shall not use them for any other purpose without the prior written consent of Lender.</p>
                    
                    <p className="font-medium mt-2">8.2 Maintenance of Business.</p>
                    <p>Borrower shall conduct its business in a prudent and orderly manner and maintain its financial condition at a level sufficient to meet its obligations under this Agreement.</p>
                    
                    <p className="font-medium mt-2">8.3 Additional Indebtedness.</p>
                    <p>Borrower shall not incur additional indebtedness that would materially impair its ability to repay amounts drawn under this Credit Facility.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">9. Events of Default</h3>
                    <p>An "Event of Default" shall occur if:</p>
                    <ul className="list-disc pl-8 mt-2 space-y-1">
                      <li>Borrower fails to repay any Draw (plus accrued interest and fees) on or before its Net 90 Maturity Date.</li>
                      <li>Borrower breaches any material term, covenant, or representation contained in this Agreement.</li>
                      <li>Borrower becomes insolvent or files for bankruptcy.</li>
                    </ul>
                    <p className="mt-2">Upon the occurrence of an Event of Default, Lender may:</p>
                    <ul className="list-disc pl-8 mt-2 space-y-1">
                      <li>Declare the entire outstanding balance immediately due and payable.</li>
                      <li>Exercise any other remedies available under applicable law.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">10. Governing Law and Dispute Resolution</h3>
                    <p className="font-medium">10.1 Governing Law.</p>
                    <p>This Agreement shall be governed by and construed in accordance with the laws of [State/Country].</p>
                    
                    <p className="font-medium mt-2">10.2 Dispute Resolution.</p>
                    <p>Any dispute arising out of or in connection with this Agreement shall be resolved by [arbitration/mediation/litigation] in the courts of [specified jurisdiction].</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold mb-2">11. Miscellaneous</h3>
                    <p className="font-medium">11.1 Entire Agreement.</p>
                    <p>This Agreement constitutes the entire agreement between the Parties and supersedes all prior understandings or agreements, whether written or oral, relating to the subject matter hereof.</p>
                    
                    <p className="font-medium mt-2">11.2 Amendments.</p>
                    <p>Any amendment or modification of this Agreement must be in writing and signed by both Parties.</p>
                    
                    <p className="font-medium mt-2">11.3 Notices.</p>
                    <p>All notices under this Agreement shall be given in writing and delivered to the addresses provided above or to such other address as a Party may designate in writing.</p>
                    
                    <p className="font-medium mt-2">11.4 Severability.</p>
                    <p>If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={() => setTermsAccepted(!termsAccepted)}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I accept the terms and conditions
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-4 px-6 z-10">
        <div className="max-w-7xl mx-auto">
          <div className={`flex ${currentStep === 1 || currentStep === 2 ? "justify-end" : "justify-between"}`}>
            {currentStep === 1 && (
              <div className="max-w-7xl mx-auto w-full flex justify-end pr-2">
                <button 
                  onClick={handleContinue}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
            
            {currentStep === 2 && (
              <div className="max-w-7xl mx-auto w-full flex justify-end pr-2">
                <button 
                  onClick={() => handleBusinessInfoSubmit({})}
                  className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
            
            {currentStep === 3 && (
              <div className="max-w-7xl mx-auto w-full flex justify-end pr-2">
                <button 
                  onClick={handleAcceptTerms}
                  disabled={!termsAccepted || isSubmitting}
                  className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                    termsAccepted && !isSubmitting
                      ? 'bg-brand-500 hover:bg-brand-600 text-white' 
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Accept Terms'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showProgressSpinner && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center">
            <Loader className="h-12 w-12 text-brand-500 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-700">Processing your credit request</p>
          </div>
        </div>
      )}
      
      {showApprovalModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h2>
              <p className="text-gray-600 mb-6">
                Your application has been submitted to our credit assessment team. They will respond within 24hrs regarding approval.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">Credit Limit</span>
                  <span className="font-bold">{formatCurrency(revolvingLOC)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Terms</span>
                  <span className="font-bold">Net-{netTerms}</span>
                </div>
              </div>
              
              <button
                onClick={handleStartOrdering}
                className="w-full px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors"
              >
                Start Ordering
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditApplication;
