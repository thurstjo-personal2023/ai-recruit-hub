import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users, Shield } from "lucide-react";
import { insertUserSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier
} from "firebase/auth";

interface RegistrationWizardProps {
  firebaseUid: string;
  email: string;
  onComplete: (user: User) => void;
}

export function RegistrationWizard({ firebaseUid, email, onComplete }: RegistrationWizardProps) {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [enableMfa, setEnableMfa] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize RecaptchaVerifier when component mounts
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // Callback is optional
      }
    });
    setRecaptchaVerifier(verifier);

    // Cleanup RecaptchaVerifier when component unmounts
    return () => {
      verifier.clear();
    };
  }, []);

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email,
      role: "employer",
      name: "",
      company: "",
      title: "",
      bio: ""
    }
  });

  const saveProgress = async (data: any) => {
    try {
      await setDoc(doc(db, "registrationProgress", firebaseUid), {
        ...data,
        lastStep: step,
        timestamp: new Date().toISOString(),
        enableMfa
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const setupMfa = async () => {
    if (!recaptchaVerifier) {
      toast({
        title: "Error",
        description: "Please wait for the security verification to initialize.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSendingCode(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Ensure phone number is in E.164 format
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedPhone = `+${phoneNumber}`;
      }

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(formattedPhone)) {
        throw new Error("Please enter a valid phone number in international format (e.g., +1234567890)");
      }

      const multiFactorSession = await multiFactor(user).getSession();
      const phoneProvider = new PhoneAuthProvider(auth);
      const verId = await phoneProvider.verifyPhoneNumber(
        {
          phoneNumber: formattedPhone,
          session: multiFactorSession
        },
        recaptchaVerifier
      );

      setVerificationId(verId);
      setPhoneNumber(formattedPhone);

      toast({
        title: "Verification Code Sent",
        description: "Please check your phone for the verification code."
      });
    } catch (error: any) {
      console.error("MFA Setup Error:", error);
      toast({
        title: "MFA Setup Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyMfaCode = async () => {
    try {
      setIsVerifyingCode(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Validate verification code format
      if (!/^\d{6}$/.test(verificationCode)) {
        throw new Error("Please enter a valid 6-digit verification code");
      }

      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await multiFactor(user).enroll(multiFactorAssertion, phoneNumber);

      toast({
        title: "MFA Enabled",
        description: "Multi-factor authentication has been set up successfully."
      });

      // Move to final step after MFA setup
      setStep(4);
      setProgress(100);
    } catch (error: any) {
      console.error("Verification Error:", error);
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        firebaseUid,
        mfaEnabled: enableMfa
      });
      const user = await response.json();

      // Clear saved progress after successful registration
      await setDoc(doc(db, "registrationProgress", firebaseUid), { completed: true });

      // Log registration completion for analytics
      await setDoc(doc(db, "analytics", `registration_${firebaseUid}`), {
        completedAt: new Date().toISOString(),
        steps: step,
        mfaEnabled: enableMfa
      });

      onComplete(user);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleNextStep = async (nextStep: number) => {
    if (step === 3 && enableMfa && !verificationId) {
      toast({
        title: "MFA Required",
        description: "Please complete MFA setup before proceeding.",
        variant: "destructive"
      });
      return;
    }

    await saveProgress(form.getValues());
    setStep(nextStep);
    setProgress(nextStep * 25);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        {/* Hidden recaptcha container */}
        <div id="recaptcha-container"></div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    onClick={() => handleNextStep(2)}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tell us about your hiring needs</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="What kind of talent are you looking for? What are your company's goals?"
                          className="h-32"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 justify-end mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleNextStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleNextStep(3)}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h2 className="text-lg font-semibold">Enhanced Security</h2>
                      <p className="text-sm text-muted-foreground">
                        Enable multi-factor authentication for additional account security
                      </p>
                    </div>
                    <Switch
                      checked={enableMfa}
                      onCheckedChange={setEnableMfa}
                    />
                  </div>

                  {enableMfa && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <div className="flex gap-2">
                          <Input
                            type="tel"
                            placeholder="+1234567890"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                          <Button
                            onClick={setupMfa}
                            disabled={isSendingCode || !phoneNumber}
                          >
                            {isSendingCode ? "Sending..." : "Send Code"}
                          </Button>
                        </div>
                      </div>

                      {verificationId && (
                        <div className="space-y-2">
                          <Label>Verification Code</Label>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Enter code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                            />
                            <Button
                              onClick={verifyMfaCode}
                              disabled={isVerifyingCode || !verificationCode}
                            >
                              {isVerifyingCode ? "Verifying..." : "Verify"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-end mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleNextStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleNextStep(4)}
                    disabled={enableMfa && !verificationId}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Review Your Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {form.getValues("name")}</p>
                    <p><strong>Company:</strong> {form.getValues("company")}</p>
                    <p><strong>Title:</strong> {form.getValues("title")}</p>
                    <p><strong>Hiring Needs:</strong></p>
                    <p className="whitespace-pre-wrap">{form.getValues("bio")}</p>
                    <p><strong>Security:</strong> {enableMfa ? "Multi-factor authentication enabled" : "Standard security"}</p>
                  </div>

                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      By completing registration, you agree to our Terms of Service and Privacy Policy.
                      Your data will be handled in accordance with GDPR and CCPA guidelines.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 justify-end mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleNextStep(3)}
                  >
                    Back
                  </Button>
                  <Button type="submit">
                    Complete Registration
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}