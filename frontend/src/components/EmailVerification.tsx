import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // Check if we have the necessary auth parameters in the URL
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      setVerificationStatus('error');
      setErrorMessage(errorDescription || 'An error occurred during email verification');
      return;
    }

    // Supabase will automatically handle the email verification
    // when the user clicks the link in their email
    const checkEmailVerification = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email_confirmed_at) {
          setVerificationStatus('success');
          toast({
            title: "Email verified!",
            description: "Your email has been successfully verified.",
            duration: 5000
          });
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setVerificationStatus('error');
          setErrorMessage('Email verification pending. Please check your email for the verification link.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('Unable to verify email. Please try again.');
      }
    };

    checkEmailVerification();
  }, [searchParams, navigate, toast]);

  const handleResendVerification = async () => {
    setIsResending(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('No user email found');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`
        }
      });

      if (error) throw error;

      toast({
        title: "Verification email sent!",
        description: "Please check your email for the verification link.",
        duration: 5000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {verificationStatus === 'loading' && (
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            )}
            {verificationStatus === 'success' && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {verificationStatus === 'error' && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {verificationStatus === 'loading' && 'Verifying Email...'}
            {verificationStatus === 'success' && 'Email Verified!'}
            {verificationStatus === 'error' && 'Verification Required'}
          </CardTitle>
          
          <CardDescription>
            {verificationStatus === 'loading' && 'Please wait while we verify your email address.'}
            {verificationStatus === 'success' && 'Your email has been successfully verified.'}
            {verificationStatus === 'error' && 'We need to verify your email address to continue.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {verificationStatus === 'error' && (
            <>
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center text-sm text-gray-600">
                  <p>Haven't received the verification email?</p>
                  <p>Check your spam folder or click below to resend.</p>
                </div>
                
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
          
          {verificationStatus === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Redirecting you to the dashboard...
              </p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification;