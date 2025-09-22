import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import LoginTransition from '@/components/LoginTransition';

const AuthConfirm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = React.useState(true);

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        if (session) {
          // Session confirmed, proceed to transition
          setIsProcessing(false);
        } else {
          toast({
            title: "Error",
            description: "No session found",
            variant: "destructive",
          });
          navigate('/auth');
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to confirm email",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  const handleTransitionComplete = () => {
    toast({
      title: "Welcome to Source!",
      description: "Your email has been verified successfully.",
      duration: 3000
    });
    navigate('/dashboard');
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-black/30 border-t-black rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Confirming your email...</p>
        </div>
      </div>
    );
  }

  return <LoginTransition onComplete={handleTransitionComplete} />;
};

export default AuthConfirm;