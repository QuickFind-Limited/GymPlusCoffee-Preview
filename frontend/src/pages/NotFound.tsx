
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-10 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl font-light text-red-400">404</span>
        </div>
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Page not found</h1>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-all duration-300 transform hover:-translate-y-0.5 focus:ring-4 focus:ring-brand-500/30"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
