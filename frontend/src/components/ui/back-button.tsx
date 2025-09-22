import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
interface BackButtonProps {
  to?: string;
  className?: string;
}
const BackButton: React.FC<BackButtonProps> = ({
  to = '/',
  className
}) => {
  const navigate = useNavigate();
  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };
  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
};
export default BackButton;