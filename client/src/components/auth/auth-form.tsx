import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { register, login } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

type FormData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "employer" | "candidate";
  jobTitle: string;
  industryExpertise: string[];
  recruitmentSpecialization: string[];
  hiringChallenges: string[];
  preferredCommunication: "email" | "sms" | "in_platform";
  notificationPreferences: {
    jobMatches: boolean;
    aiInsights: boolean;
    candidateUpdates: boolean;
  };
};

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "candidate",
      jobTitle: "",
      industryExpertise: ["Technology"],
      recruitmentSpecialization: ["Software Engineering"],
      hiringChallenges: [],
      preferredCommunication: "email",
      notificationPreferences: {
        jobMatches: true,
        aiInsights: true,
        candidateUpdates: true
      }
    },
  });

  async function onSubmit(data: FormData) {
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        const credentials = await register(data.email, data.password);
        // Register user in our backend
        await apiRequest("POST", "/api/auth/register", {
          ...data,
          uid: credentials.user.uid,
        });
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
      }
      window.location.href = "/dashboard";
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            {!isLogin && (
              <>
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
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border rounded"
                        >
                          <option value="candidate">Job Seeker</option>
                          <option value="employer">Employer</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <Button type="submit" className="w-full">
              {isLogin ? "Login" : "Create Account"}
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
      </CardContent>
    </Card>
  );
}