import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertUserSchema, JobTitle, CommunicationPreference } from "@shared/schema";
import { auth, storage } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Trash2 } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Textarea } from "@/components/ui/textarea";


interface RegistrationWizardProps {
  firebaseUid: string;
  email: string;
  onComplete: () => void;
}

export function RegistrationWizard({ firebaseUid, email, onComplete }: RegistrationWizardProps) {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(25);
  const [enableMfa, setEnableMfa] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email,
      firstName: "",
      lastName: "",
      phoneNumber: "",
      jobTitle: undefined,
      linkedinUrl: "",
      profilePicture: "",
      communicationPreference: "email",
      company: "",
      bio: ""
    }
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setProfilePicture(file);

    try {
      const storageRef = ref(storage, `profilePictures/${firebaseUid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setProfilePictureUrl(url);
      form.setValue('profilePicture', url);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
    }
  };

  const removeProfilePicture = () => {
    setProfilePicture(null);
    setProfilePictureUrl("");
    form.setValue('profilePicture', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNextStep = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const nextStep = step + 1;
    setStep(nextStep);
    setProgress(nextStep * 25);
  };

  const handlePreviousStep = () => {
    const prevStep = step - 1;
    setStep(prevStep);
    setProgress(prevStep * 25);
  };

  const onSubmit = async (data: any) => {
    try {
      // Complete registration process
      onComplete();
    } catch (error: any) {
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
        <CardTitle>Personal Information</CardTitle>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="+1234567890" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your job title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(JobTitle).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end mt-6">
                  <Button type="button" onClick={handleNextStep}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <FormField
                  control={form.control}
                  name="linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn Profile URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://linkedin.com/in/your-profile" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Picture
                    </Button>
                    {profilePictureUrl && (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={removeProfilePicture}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  {profilePictureUrl && (
                    <div className="mt-4">
                      <img
                        src={profilePictureUrl}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="communicationPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Communication Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select communication preference" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CommunicationPreference).map(([key, value]) => (
                            <SelectItem key={key} value={value}>
                              {value.charAt(0).toUpperCase() + value.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={handlePreviousStep}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleNextStep}>
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
                    <p><strong>Name:</strong> {form.getValues("firstName")} {form.getValues("lastName")}</p>
                    <p><strong>Phone:</strong> {form.getValues("phoneNumber")}</p>
                    <p><strong>Job Title:</strong> {form.getValues("jobTitle")}</p>
                    <p><strong>LinkedIn:</strong> {form.getValues("linkedinUrl")}</p>
                    <p><strong>Communication Preference:</strong> {form.getValues("communicationPreference")}</p>
                    <p><strong>Company:</strong> {form.getValues("company")}</p>
                    <p><strong>Bio:</strong> {form.getValues("bio")}</p>
                    {profilePictureUrl && <p><strong>Profile Picture:</strong> <img src={profilePictureUrl} alt="Profile Picture" className="w-16 h-16 rounded-full object-cover"/></p>}

                  </div>

                  <div className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      By completing registration, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={handlePreviousStep}>
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