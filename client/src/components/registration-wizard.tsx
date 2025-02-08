import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Users } from "lucide-react";
import { insertUserSchema } from "@shared/schema";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";

interface RegistrationWizardProps {
  firebaseUid: string;
  email: string;
  onComplete: (user: User) => void;
}

export function RegistrationWizard({ firebaseUid, email, onComplete }: RegistrationWizardProps) {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(33);
  const { toast } = useToast();

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
      // Save progress to Firestore
      await setDoc(doc(db, "registrationProgress", firebaseUid), {
        ...data,
        lastStep: step,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        firebaseUid
      });
      const user = await response.json();

      // Clear saved progress after successful registration
      await setDoc(doc(db, "registrationProgress", firebaseUid), { completed: true });

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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
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
                    onClick={() => {
                      saveProgress(form.getValues());
                      setStep(2);
                      setProgress(66);
                    }}
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
                    onClick={() => {
                      setStep(1);
                      setProgress(33);
                    }}
                  >
                    Back
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => {
                      saveProgress(form.getValues());
                      setStep(3);
                      setProgress(100);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Review Your Information</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {form.getValues("name")}</p>
                    <p><strong>Company:</strong> {form.getValues("company")}</p>
                    <p><strong>Title:</strong> {form.getValues("title")}</p>
                    <p><strong>Hiring Needs:</strong></p>
                    <p className="whitespace-pre-wrap">{form.getValues("bio")}</p>
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
                    onClick={() => {
                      setStep(2);
                      setProgress(66);
                    }}
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