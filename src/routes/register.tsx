import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — Smart Portal" },
      { name: "description", content: "Create a new account to start managing your projects and tasks." },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
    role: z.string().trim().max(50).optional(),
    password: z.string().min(6, "Password must be at least 6 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ["confirm"] });
type FormValues = z.infer<typeof schema>;

function RegisterPage() {
  const { register: signup, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: "Team Member", password: "", confirm: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await signup({ name: values.name, email: values.email, password: values.password, role: values.role });
      toast.success("Account created. Welcome!");
      navigate({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Smart Portal</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight">Start in seconds.</h2>
          <p className="max-w-md text-sidebar-foreground/70">
            Create your free workspace, invite your team, and turn ideas into shipped work.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/60">© {new Date().getFullYear()} Smart Task & Team Management Portal</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Create account</CardTitle>
            <CardDescription>It only takes a minute. No credit card required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" placeholder="e.g. Project Manager" {...form.register("role")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
                  {form.formState.errors.password && (
                    <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm</Label>
                  <Input id="confirm" type="password" autoComplete="new-password" {...form.register("confirm")} />
                  {form.formState.errors.confirm && (
                    <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
