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
  name: string;
  role: "employer" | "candidate";
  company?: string;
};

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "candidate",
    },
  });

  async function onSubmit(data: FormData) {
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        const credentials = await register(data.email, data.password);
        await apiRequest("POST", "/api/auth/register", {
          ...data,
          uid: credentials.user.uid,
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
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
              {isLogin ? "Login" : "Register"}
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
