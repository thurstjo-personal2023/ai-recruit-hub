import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertUserSchema } from "@shared/schema";
import { auth } from "@/lib/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendEmailVerification,
  OAuthProvider 
} from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiGoogle, SiLinkedin } from "react-icons/si";
import { Separator } from "@/components/ui/separator";
import { RegistrationWizard } from "@/components/registration-wizard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [authData, setAuthData] = useState<{ uid: string; email: string } | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "employer",
      company: "",
      title: "",
      bio: ""
    }
  });

  const handleSocialSignIn = async (provider: GoogleAuthProvider | OAuthProvider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      try {
        await apiRequest("GET", "/api/auth/me");
        window.location.href = "/jobs";
      } catch (error) {
        setAuthData({ uid: user.uid, email: user.email! });
        setShowWizard(true);
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to continue with social sign-in.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleGoogleSignIn = () => handleSocialSignIn(new GoogleAuthProvider());
  const handleLinkedInSignIn = () => handleSocialSignIn(new OAuthProvider('linkedin.com'));

  const handleEmailSignIn = async (data: any) => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        window.location.href = "/jobs";
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await sendEmailVerification(userCred.user);
        setAuthData({ uid: userCred.user.uid, email: userCred.user.email! });
        setShowWizard(true);
        toast({
          title: "Verification Email Sent",
          description: "Please check your email to verify your account."
        });
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          title: "Email Already Registered",
          description: "Would you like to sign in instead?",
          action: <Button variant="link" onClick={() => setIsLogin(true)}>Sign In</Button>
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleResendVerification = async () => {
    if (!authData) return;

    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setResendTimer(60);
        const interval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        toast({
          title: "Verification Email Resent",
          description: "Please check your email for the verification link."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleWizardComplete = () => {
    window.location.href = "/jobs";
  };

  if (showWizard && authData) {
    return (
      <div className="container mx-auto px-4 py-8">
        {auth.currentUser && !auth.currentUser.emailVerified && (
          <Alert variant="warning" className="mb-6">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              Please verify your email to complete registration.
              {resendTimer > 0 ? (
                <span className="ml-2">Resend available in {resendTimer}s</span>
              ) : (
                <Button 
                  variant="link" 
                  className="ml-2 p-0 h-auto" 
                  onClick={handleResendVerification}
                >
                  Resend verification email
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        <RegistrationWizard
          firebaseUid={authData.uid}
          email={authData.email}
          onComplete={handleWizardComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>{isLogin ? "Sign In" : "Create Account"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleGoogleSignIn}
            >
              <SiGoogle className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLinkedInSignIn}
            >
              <SiLinkedin className="mr-2 h-4 w-4" />
              Continue with LinkedIn
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailSignIn)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "Need an account?" : "Already have an account?"}
                </Button>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}