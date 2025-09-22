import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import LoginTransition from '@/components/LoginTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logger } from '@/services/Logger';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  // Listen for successful authentication
  useEffect(() => {
    if (user && isLoading) {
      Logger.debug('User authenticated, showing transition');
      setIsLoading(false);
      setShowTransition(true);
    }
  }, [user, isLoading]);

  const validateForm = (isSignUp: boolean) => {
    setError(null);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return false;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm(false)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      Logger.debug('Starting sign in...');
      await signIn(email, password);
      // Success - useEffect will handle showing transition when user becomes available
      Logger.debug('Sign in completed successfully');
    } catch (err: any) {
      Logger.error('Sign in error', err);
      setIsLoading(false);
      
      // Handle specific error cases
      const errorMessage = err?.message || 'Authentication failed';
      if (errorMessage.includes('Email not confirmed') || errorMessage.includes('email_not_confirmed')) {
        setError('Please verify your email before signing in. Check your inbox for the verification link.');
      } else if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (errorMessage.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm(true)) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await signUp(email, password);
      
      setIsLoading(false);
      
      // Reset form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Show success message
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
        duration: 5000
      });
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err?.message || 'Sign up failed';
      
      // Check for various ways Supabase might indicate existing user
      if (errorMessage.includes("already registered") || 
          errorMessage.includes("User already registered") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("duplicate key value")) {
        setError("This email is already registered. Please sign in instead.");
      } else if (errorMessage.includes("rate limit")) {
        setError("Too many sign up attempts. Please try again later.");
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleTransitionComplete = () => {
    toast({
      title: "Welcome to Source!",
      description: "You've successfully logged in.",
      duration: 3000
    });
    navigate('/dashboard');
  };

  if (showTransition) {
    return <LoginTransition onComplete={handleTransitionComplete} />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center animate-in fade-in-0 duration-700">
      {/* Centered Login Form */}
      <div className="w-full max-w-md p-8 space-y-8">
        {/* Source Branding */}
        <div className="text-center space-y-6 animate-in slide-in-from-top-4 duration-700">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-black tracking-tight">
              Source.
            </h1>
          </div>
        </div>

        {/* Auth Tabs */}
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700 delay-200">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 border-gray-300 focus:border-black focus:ring-black bg-white transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    placeholder="Enter your password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 border-gray-300 focus:border-black focus:ring-black bg-white transition-all duration-200"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isLoading} 
                  className="w-full h-12 bg-black text-white hover:bg-gray-800 font-medium transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="h-12 border-gray-300 focus:border-black focus:ring-black bg-white transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    placeholder="Create a password (min. 6 characters)"
                    type="password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 border-gray-300 focus:border-black focus:ring-black bg-white transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    placeholder="Confirm your password"
                    type="password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="h-12 border-gray-300 focus:border-black focus:ring-black bg-white transition-all duration-200"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isLoading} 
                  className="w-full h-12 bg-black text-white hover:bg-gray-800 font-medium transition-all duration-200 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <p className="text-xs text-gray-600 text-center">
                  By signing up, you'll receive a verification email to confirm your account.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="text-center animate-in fade-in-0 duration-700 delay-500">
          <p className="text-xs text-gray-400">
            Trading as Source (Src.)<br />
            © 2025 - Registered as QuickFind AI - All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;