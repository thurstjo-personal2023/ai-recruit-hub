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
import { SiGoogle, SiLinkedin } from "react-icons/si";
import { Separator } from "@/components/ui/separator";
import { RegistrationWizard } from "@/components/registration-wizard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [authData, setAuthData] = useState<{ uid: string; email: string } | null>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserSchema.pick({ 
      email: true,
      password: true
    })),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleSocialSignIn = async (provider: GoogleAuthProvider | OAuthProvider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      setAuthData({ uid: user.uid, email: user.email! });
      setShowWizard(true);
    } catch (error: any) {
      console.error("Social sign-in error:", error);
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleGoogleSignIn = () => handleSocialSignIn(new GoogleAuthProvider());
  const handleLinkedInSignIn = () => handleSocialSignIn(new OAuthProvider('linkedin.com'));

  const handleEmailSignIn = async (data: { email: string; password: string }) => {
    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, data.email, data.password);
        window.location.href = "/jobs";
      } else {
        console.log("Creating new account with:", data.email);
        const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        console.log("Account created:", userCred.user.uid);
        await sendEmailVerification(userCred.user);
        setAuthData({ uid: userCred.user.uid, email: userCred.user.email! });
        setShowWizard(true);
        toast({
          title: "Account Created",
          description: "Please complete your profile information.",
        });
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (showWizard && authData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <RegistrationWizard
          firebaseUid={authData.uid}
          email={authData.email}
          onComplete={() => window.location.href = "/jobs"}
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