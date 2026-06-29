import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/forms/project-form";
import { createProject } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/projects/new")({
  head: () => ({ meta: [{ title: "New project — Smart Portal" }] }),
  component: NewProjectPage,
});

function NewProjectPage() {
  const navigate = useNavigate();
  return (
    <>
      <Topbar title="New project" subtitle="Add a new project to your workspace" />
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to="/projects"><ChevronLeft className="mr-1 h-4 w-4" /> Back to projects</Link>
        </Button>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <CardDescription>Fill in the basics — you can edit later.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectForm
              submitLabel="Create project"
              onSubmit={(v) => {
                createProject(v);
                toast.success("Project created");
                navigate({ to: "/projects", replace: true });
                
              }}
            />
          </CardContent>
        </Card>
      </PageShell>
    </>
  );
}
