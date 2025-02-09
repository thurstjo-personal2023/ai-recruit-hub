import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { insertUserSchema, insertCompanySchema } from "@shared/schema";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import {
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier
} from "firebase/auth";
import { Loader2 } from "lucide-react";

// Predefined options for dropdowns and multi-selects
const INDUSTRY_OPTIONS = [
  "Technology", "Healthcare", "Finance", "Education", "Manufacturing",
  "Retail", "Consulting", "Non-Profit"
];

const HIRING_TYPES = [
  "Full-time", "Part-time", "Contract", "Remote", "Hybrid", "Internship"
];

const RECRUITMENT_SPECIALIZATIONS = [
  "Entry-Level", "Mid-Level", "Senior", "Executive", "Technical",
  "Sales", "Marketing", "Customer Service"
];

const HIRING_PRIORITIES = [
  "Speed of Hire", "Quality of Candidates", "Cost Efficiency",
  "Cultural Fit", "Technical Skills", "Diversity & Inclusion"
];

const LANGUAGE_PREFERENCES = [
  "English", "Spanish", "French", "German", "Chinese", "Japanese"
];

interface RegistrationWizardProps {
  firebaseUid: string;
  email: string;
  onComplete: (user: User) => void;
}

export function RegistrationWizard({ firebaseUid, email, onComplete }: RegistrationWizardProps) {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(20);
  const [enableMfa, setEnableMfa] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const { toast } = useToast();

  const userForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email,
      role: "employer",
      firstName: "",
      lastName: "",
      jobTitle: "",
      linkedinUrl: "",
      yearsOfExperience: 0,
      industryExpertise: [],
      recruitmentSpecialization: [],
      preferredCommunication: "email",
      notificationPreferences: {
        jobMatches: true,
        aiInsights: true,
        candidateUpdates: true
      }
    }
  });

  const companyForm = useForm({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      website: "",
      industry: "",
      size: "",
      headquartersCountry: "",
      headquartersCity: "",
      hiringTypes: [],
      hiringPriorities: [],
      useAiJobDescription: true,
      useAiPersona: true,
      requiredSkills: [],
      languagePreferences: ["English"]
    }
  });

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible'
    });
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, []);

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
      if (!user) throw new Error("No authenticated user found");

      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        formattedPhone = `+${phoneNumber}`;
      }

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
      if (!user) throw new Error("No authenticated user found");

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

      // Move to company profile setup after MFA
      handleNextStep(3);
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const generateAiSuggestions = async () => {
    setIsLoadingAiSuggestions(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // This would be replaced with actual AI API calls
      return {
        recommendedRoles: ["Software Engineer", "Product Manager"],
        suggestedKeywords: ["React", "TypeScript", "AI"],
        marketInsights: "High demand for remote positions in tech sector"
      };
    } catch (error: any) {
      toast({
        title: "AI Suggestions Error",
        description: "Unable to generate AI suggestions at this time.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const onSubmit = async () => {
    try {
      const userData = userForm.getValues();
      const companyData = companyForm.getValues();

      const response = await apiRequest("POST", "/api/auth/register", {
        user: userData,
        company: companyData,
        firebaseUid,
        mfaEnabled: enableMfa
      });

      const user = await response.json();

      await setDoc(doc(db, "registrationProgress", firebaseUid), { 
        completed: true,
        timestamp: new Date().toISOString()
      });

      onComplete(user);
    } catch (error: any) {
      toast({
        title: "Registration Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleNextStep = async (nextStep: number) => {
    if (step === 2 && enableMfa && !verificationId) {
      toast({
        title: "MFA Required",
        description: "Please complete MFA setup before proceeding.",
        variant: "destructive"
      });
      return;
    }

    // Save progress before moving to next step
    const currentData = {
      user: userForm.getValues(),
      company: companyForm.getValues()
    };
    await saveProgress(currentData);

    setStep(nextStep);
    setProgress(nextStep * 20);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {step === 1 && "Personal Profile"}
          {step === 2 && "Security Setup"}
          {step === 3 && "Company Profile"}
          {step === 4 && "Hiring Preferences"}
          {step === 5 && "Review & Complete"}
        </CardTitle>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div id="recaptcha-container"></div>

        {/* Step 1: Personal Profile */}
        {step === 1 && (
          <Form {...userForm}>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={userForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={userForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={userForm.control}
                name="jobTitle"
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

              <FormField
                control={userForm.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://linkedin.com/in/..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={userForm.control}
                name="industryExpertise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry Expertise</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={INDUSTRY_OPTIONS.map(i => ({ label: i, value: i }))}
                        {...field}
                      />
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
                  Next: Security Setup
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 2: Security Setup */}
        {step === 2 && (
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
                disabled={enableMfa && !verificationId}
              >
                Next: Company Profile
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Company Profile */}
        {step === 3 && (
          <Form {...companyForm}>
            <form className="space-y-4">
              <FormField
                control={companyForm.control}
                name="name"
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
                control={companyForm.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={companyForm.control}
                  name="headquartersCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={companyForm.control}
                  name="headquartersCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                >
                  Next: Hiring Preferences
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 4: Hiring Preferences */}
        {step === 4 && (
          <Form {...companyForm}>
            <form className="space-y-4">
              <FormField
                control={companyForm.control}
                name="hiringTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hiring Types</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={HIRING_TYPES.map(t => ({ label: t, value: t }))}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="hiringPriorities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hiring Priorities</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={HIRING_PRIORITIES.map(p => ({ label: p, value: p }))}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>AI-Powered Features</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium">AI Job Description Optimization</h4>
                      <p className="text-sm text-muted-foreground">
                        Let AI help optimize your job postings
                      </p>
                    </div>
                    <FormField
                      control={companyForm.control}
                      name="useAiJobDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium">AI Candidate Persona</h4>
                      <p className="text-sm text-muted-foreground">
                        Generate ideal candidate profiles using AI
                      </p>
                    </div>
                    <FormField
                      control={companyForm.control}
                      name="useAiPersona"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
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
                <Button
                  type="button"
                  onClick={() => handleNextStep(5)}
                >
                  Next: Review
                </Button>
              </div>
            </form>
          </Form>
        )}

        {/* Step 5: Review & Complete */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Personal Profile</h3>
                <div className="space-y-1">
                  <p><strong>Name:</strong> {userForm.getValues("firstName")} {userForm.getValues("lastName")}</p>
                  <p><strong>Job Title:</strong> {userForm.getValues("jobTitle")}</p>
                  <p><strong>Industry Expertise:</strong> {userForm.getValues("industryExpertise").join(", ")}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Company Profile</h3>
                <div className="space-y-1">
                  <p><strong>Company:</strong> {companyForm.getValues("name")}</p>
                  <p><strong>Location:</strong> {companyForm.getValues("headquartersCity")}, {companyForm.getValues("headquartersCountry")}</p>
                  <p><strong>Hiring Types:</strong> {companyForm.getValues("hiringTypes").join(", ")}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">AI Features</h3>
                <div className="space-y-1">
                  <p>✓ {companyForm.getValues("useAiJobDescription") ? "AI Job Description Optimization enabled" : "Standard job descriptions"}</p>
                  <p>✓ {companyForm.getValues("useAiPersona") ? "AI Candidate Persona enabled" : "Manual candidate matching"}</p>
                </div>
              </div>

              {isLoadingAiSuggestions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Generating AI recommendations...</span>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={generateAiSuggestions}
                >
                  Generate AI Recommendations
                </Button>
              )}
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                By completing registration, you agree to our Terms of Service and Privacy Policy.
                Your data will be handled in accordance with GDPR and CCPA guidelines.
              </p>
            </div>

            <div className="flex gap-4 justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNextStep(4)}
              >
                Back
              </Button>
              <Button onClick={onSubmit}>
                Complete Registration
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}