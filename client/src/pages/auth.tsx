import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertUserSchema } from "@shared/schema";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SiGoogle, SiLinkedin } from "react-icons/si";
import { Separator } from "@/components/ui/separator";
import { RegistrationWizard } from "@/components/registration-wizard";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [authData, setAuthData] = useState<{ uid: string; email: string } | null>(null);
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

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const { user } = result;

      // Check if user exists in our database
      try {
        await apiRequest("GET", "/api/auth/me");
        window.location.href = "/jobs";
      } catch (error) {
        // User doesn't exist in our database, show registration wizard
        setAuthData({ uid: user.uid, email: user.email! });
        setShowWizard(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

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
      <RegistrationWizard
        firebaseUid={authData.uid}
        email={authData.email}
        onComplete={handleWizardComplete}
      />
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