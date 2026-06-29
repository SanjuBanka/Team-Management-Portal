import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, UserCircle, Briefcase, Calendar } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Smart Portal" }] }),
  component: ProfilePage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  role: z.string().trim().max(50),
});
type Values = z.infer<typeof schema>;

function ProfilePage() {
  const { user, updateMe } = useAuth();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: { name: user?.name ?? "", email: user?.email ?? "", role: user?.role ?? "" },
  });

  return (
    <>
      <Topbar title="Profile" subtitle="Your personal account details" />
      <PageShell>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="flex flex-col items-center p-6 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.role}</p>
              <div className="mt-6 w-full space-y-3 text-left text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {user ? format(new Date(user.createdAt), "MMM d, yyyy") : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-xs">{user?.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Edit profile</CardTitle>
              <CardDescription>Update your name, email, or role.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(async (v) => {
                  try {
                    await updateMe(v);
                    toast.success("Profile updated");
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed to update");
                  }
                })}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" {...form.register("name")} />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" {...form.register("role")} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </>
  );
}
