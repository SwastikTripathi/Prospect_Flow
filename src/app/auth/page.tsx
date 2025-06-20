
'use client';

import { useEffect, useState, useRef }
from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';

console.log('[AuthPage] NEXT_PUBLIC_SITE_URL (at module load):', process.env.NEXT_PUBLIC_SITE_URL);

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(1, { message: 'Please confirm your password.' })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

type AuthView = 'signin' | 'signup' | 'forgotpassword';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

function getAuthRedirectUrl(): string | undefined {
    const siteURL = process.env.NEXT_PUBLIC_SITE_URL;
    console.log('[getAuthRedirectUrl] NEXT_PUBLIC_SITE_URL:', siteURL);

    if (!siteURL) {
        console.error('[getAuthRedirectUrl] NEXT_PUBLIC_SITE_URL is not defined.');
        return undefined;
    }

    try {
        const baseUrl = new URL(siteURL);
        let path = baseUrl.pathname;
        if (path.endsWith('/auth') || path.endsWith('/auth/')) {
            baseUrl.pathname = path.replace(/\/+$/, '').replace(/\/auth\/?$/, '/auth');
        } else if (path === '/' || path === '') {
            baseUrl.pathname = '/auth';
        } else {
            baseUrl.pathname = path.replace(/\/$/, '') + '/auth';
        }
        console.log('[getAuthRedirectUrl] Calculated redirect URL:', baseUrl.toString());
        return baseUrl.toString();
    } catch (e) {
        console.error('[getAuthRedirectUrl] Error constructing redirect URL:', e);
        return undefined;
    }
}


export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [currentView, setCurrentView] = useState<AuthView>('signin');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [isSendingResetLink, setIsSendingResetLink] = useState(false);

  const isCheckingAuthRef = useRef(isCheckingAuth);
  useEffect(() => {
    isCheckingAuthRef.current = isCheckingAuth;
  }, [isCheckingAuth]);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });


  useEffect(() => {
    console.log('[AuthPage useEffect] Starting auth state check and setup.');
    setIsCheckingAuth(true); 

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthPage onAuthStateChange] Event:', event, 'Session:', session ? 'Exists' : 'Null');
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'PASSWORD_RECOVERY' || event === 'USER_UPDATED') && session) {
        console.log('[AuthPage onAuthStateChange] User signed in or session updated, redirecting to /');
        router.replace('/');
      }
      setIsCheckingAuth(false);
    });

    const checkSession = async () => {
      console.log('[AuthPage checkSession] Checking initial session.');
      if (!isCheckingAuthRef.current) {
        console.log('[AuthPage checkSession] Already stopped checking auth.');
        return;
      }
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthPage checkSession] Error getting session:', error);
          setIsCheckingAuth(false);
          return;
        }

        if (currentSession) {
          console.log('[AuthPage checkSession] Active session found, redirecting to /');
          router.replace('/');
        } else {
          console.log('[AuthPage checkSession] No active session found.');
        }
      } catch (err) {
        console.error('[AuthPage checkSession] Exception during getSession:', err);
      } finally {
        console.log('[AuthPage checkSession] Finished checking session.');
        setIsCheckingAuth(false);
      }
    };
    checkSession();

    const action = searchParams?.get('action');
    console.log('[AuthPage useEffect] Action from URL params:', action);
    if (action === 'signup') {
      setCurrentView('signup');
    } else {
      setCurrentView('signin');
    }


    return () => {
      console.log('[AuthPage useEffect Cleanup] Unsubscribing from auth state changes.');
      authSubscription?.unsubscribe();
    };
  }, [router, searchParams]);


  const handleSignIn = async (values: SignInFormValues) => {
    console.log('[handleSignIn] Attempting sign in for email:', values.email);
    setIsLoading(true);
    setAuthError(null);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      console.log('[handleSignIn] Supabase signInWithPassword response. Error:', error, 'Data:', data);
      if (error) {
        setAuthError(error.message);
        toast({ title: 'Sign In Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Signed In Successfully!'});
        console.log('[handleSignIn] Sign in successful for:', values.email);
      }
    } catch (error: any) {
      console.error('[handleSignIn] Exception during sign in:', error);
      setAuthError(error.message || 'An unexpected error occurred.');
      toast({ title: 'Sign In Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (values: SignUpFormValues) => {
    console.log('[handleSignUp] Attempting sign up for email:', values.email);
    setIsLoading(true);
    setAuthError(null);
    setShowConfirmationMessage(false);

    const signUpRedirectURL = getAuthRedirectUrl();
    console.log('[handleSignUp] Sign up redirect URL:', signUpRedirectURL);

    if (!signUpRedirectURL && process.env.NEXT_PUBLIC_SITE_URL) {
        console.error('[handleSignUp] Site URL improperly configured. Cannot proceed with sign up.');
        toast({ title: 'Configuration Error', description: 'Site URL is improperly configured. Cannot proceed with sign up.', variant: 'destructive' });
        setIsLoading(false);
        return;
    }
    
    try {
      console.log('[handleSignUp] Calling supabase.auth.signUp with email:', values.email, 'and options:', { emailRedirectTo: signUpRedirectURL });
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: signUpRedirectURL,
        },
      });
      console.log('[handleSignUp] Supabase signUp response. Error:', error, 'Data:', data);

      if (error) {
        setAuthError(error.message);
        toast({ title: 'Sign Up Failed', description: error.message, variant: 'destructive' });
      } else if (data.session) {
        toast({ title: 'Account Created & Signed In!' });
        console.log('[handleSignUp] Sign up successful and session created for:', values.email);
      } else if (data.user && !data.session) {
        setShowConfirmationMessage(true);
        toast({ title: 'Account Created!', description: 'Please check your email to confirm your account.' });
        console.log('[handleSignUp] Sign up successful, confirmation email sent for:', values.email);
        signUpForm.reset();
        signInForm.setValue('email', values.email); 
        setCurrentView('signin'); 
      } else {
         setAuthError('An unexpected outcome occurred during sign up.');
         toast({ title: 'Sign Up Issue', description: 'An unexpected outcome occurred.', variant: 'destructive' });
         console.warn('[handleSignUp] Unexpected outcome for:', values.email, 'Data:', data);
      }
    } catch (error: any) {
      console.error('[handleSignUp] Exception during sign up:', error);
      setAuthError(error.message || 'An unexpected error occurred.');
      toast({ title: 'Sign Up Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    console.log('[handleGoogleSignIn] Attempting Google sign in.');
    setIsGoogleLoading(true);
    setAuthError(null);
    
    const googleRedirectURL = getAuthRedirectUrl(); 
    console.log('[handleGoogleSignIn] Google redirect URL:', googleRedirectURL);
    
    if (!googleRedirectURL && process.env.NEXT_PUBLIC_SITE_URL) {
        console.error('[handleGoogleSignIn] Site URL for Google Sign-In is improperly configured.');
        toast({ title: 'Configuration Error', description: 'Site URL for Google Sign-In is improperly configured.', variant: 'destructive' });
        setIsGoogleLoading(false);
        return;
    }

    console.log('[handleGoogleSignIn] Calling supabase.auth.signInWithOAuth with provider: google and options:', { redirectTo: googleRedirectURL });
    const { error, data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: googleRedirectURL,
      },
    });
    console.log('[handleGoogleSignIn] Supabase signInWithOAuth response. Error:', error, 'Data:', data);
    if (error) {
      setAuthError(error.message);
      toast({ title: 'Google Sign-In Failed', description: error.message, variant: 'destructive' });
      setIsGoogleLoading(false);
    }
    // If successful, Supabase handles the redirect, so no need to set loading to false here unless there's an error.
  };

  const handleForgotPasswordRequest = async (values: ForgotPasswordFormValues) => {
    console.log('[handleForgotPasswordRequest] Attempting password reset for email:', values.email);
    setIsSendingResetLink(true);
    setAuthError(null);
    
    const resetLinkRedirectTo = getAuthRedirectUrl();
    console.log('[handleForgotPasswordRequest] Reset link redirect URL:', resetLinkRedirectTo);

    if (!resetLinkRedirectTo && process.env.NEXT_PUBLIC_SITE_URL) {
        console.error('[handleForgotPasswordRequest] Site URL for password reset is improperly configured.');
        toast({ title: 'Configuration Error', description: 'Site URL for password reset is improperly configured.', variant: 'destructive' });
        setIsSendingResetLink(false);
        return;
    }

    try {
      console.log('[handleForgotPasswordRequest] Calling supabase.auth.resetPasswordForEmail for:', values.email, 'with options:', { redirectTo: resetLinkRedirectTo });
      const { error, data } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: resetLinkRedirectTo 
      });
      console.log('[handleForgotPasswordRequest] Supabase resetPasswordForEmail response. Error:', error, 'Data:', data);
      if (error) {
        setAuthError(error.message);
        toast({ title: 'Password Reset Failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Password Reset Email Sent', description: 'If an account exists for this email, a password reset link has been sent.' });
        console.log('[handleForgotPasswordRequest] Password reset email sent for:', values.email);
        forgotPasswordForm.reset();
        setCurrentView('signin'); 
      }
    } catch (error: any) {
      console.error('[handleForgotPasswordRequest] Exception during password reset:', error);
      setAuthError(error.message || 'An unexpected error occurred.');
      toast({ title: 'Password Reset Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
    setIsSendingResetLink(false);
  };


  if (isCheckingAuth) {
    console.log('[AuthPage Render] Rendering loading spinner while checking auth.');
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <PublicNavbar />
        <main className="flex flex-1 items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
      </div>
    );
  }
  console.log('[AuthPage Render] Rendering main auth UI. Current view:', currentView);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />
      <main className="flex flex-1 items-center justify-center p-4">
        {currentView === 'forgotpassword' ? (
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline">Reset Your Password</CardTitle>
              <CardDescription>
                Enter your email address below and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPasswordRequest)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {authError && <p className="text-sm text-destructive">{authError}</p>}
                </CardContent>
                <CardFooter className="flex-col items-stretch space-y-3">
                  <Button type="submit" disabled={isSendingResetLink} className="w-full">
                    {isSendingResetLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Link
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="text-primary hover:underline text-sm"
                    onClick={() => setCurrentView('signin')}
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to Sign In
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        ) : (
            <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as AuthView)} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                <Card className="shadow-xl">
                    <CardHeader>
                    <CardTitle className="font-headline">Welcome Back!</CardTitle>
                    <CardDescription>Sign in to access your ProspectFlow dashboard.</CardDescription>
                    </CardHeader>
                    <Form {...signInForm}>
                    <form onSubmit={signInForm.handleSubmit(handleSignIn)}>
                        <CardContent className="space-y-4">
                        <FormField
                            control={signInForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={signInForm.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                    <Input
                                        type={showSignInPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...field}
                                        className="pr-10"
                                    />
                                    </FormControl>
                                    <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => setShowSignInPassword(!showSignInPassword)}
                                    tabIndex={-1}
                                    >
                                    {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    <span className="sr-only">{showSignInPassword ? 'Hide password' : 'Show password'}</span>
                                    </Button>
                                </div>
                                <div className="flex justify-end mt-1">
                                  <Button
                                      type="button"
                                      variant="link"
                                      className="p-0 h-auto text-xs text-primary hover:underline"
                                      onClick={() => setCurrentView('forgotpassword')}
                                  >
                                      Forgot password?
                                  </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {showConfirmationMessage && (
                            <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                            Account created! Please check your email to confirm your account before signing in.
                            </p>
                        )}
                        {authError && <p className="text-sm text-destructive">{authError}</p>}
                        </CardContent>
                        <CardFooter className="flex-col items-stretch space-y-3">
                        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Sign In
                        </Button>
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or continue with
                            </span>
                            </div>
                        </div>
                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                            Sign in with Google
                        </Button>
                        </CardFooter>
                    </form>
                    </Form>
                </Card>
                </TabsContent>
                <TabsContent value="signup">
                <Card className="shadow-xl">
                    <CardHeader>
                    <CardTitle className="font-headline">Create an Account</CardTitle>
                    <CardDescription>Join ProspectFlow to streamline your outreach.</CardDescription>
                    </CardHeader>
                    <Form {...signUpForm}>
                    <form onSubmit={signUpForm.handleSubmit(handleSignUp)}>
                        <CardContent className="space-y-4">
                        <FormField
                            control={signUpForm.control}
                            name="email"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                <Input type="email" placeholder="you@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={signUpForm.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                    <Input
                                        type={showSignUpPassword ? 'text' : 'password'}
                                        placeholder="Must be at least 6 characters"
                                        {...field}
                                        className="pr-10"
                                    />
                                    </FormControl>
                                    <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                                    tabIndex={-1}
                                    >
                                    {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    <span className="sr-only">{showSignUpPassword ? 'Hide password' : 'Show password'}</span>
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={signUpForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                    <Input
                                        type={showSignUpConfirmPassword ? 'text' : 'password'}
                                        placeholder="Confirm your password"
                                        {...field}
                                        className="pr-10"
                                    />
                                    </FormControl>
                                    <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-primary"
                                    onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                                    tabIndex={-1}
                                    >
                                    {showSignUpConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        {authError && <p className="text-sm text-destructive">{authError}</p>}
                        </CardContent>
                        <CardFooter className="flex-col items-stretch space-y-3">
                        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Account
                        </Button>
                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or sign up with
                            </span>
                            </div>
                        </div>
                        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                            Sign up with Google
                        </Button>
                        </CardFooter>
                    </form>
                    </Form>
                </Card>
                </TabsContent>
            </Tabs>
        )}
      </main>
    </div>
  );
}
