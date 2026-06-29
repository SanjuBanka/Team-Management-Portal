import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectForm } from "@/components/forms/project-form";
import { getProject, updateProject } from "@/lib/store";
import { EmptyState } from "@/components/layout/empty-state";
import { FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/projects/$projectId/edit")({
  head: () => ({ meta: [{ title: "Edit project — Smart Portal" }] }),
  component: EditProjectPage,
});

function EditProjectPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const project = getProject(projectId);

  return (
    <>
      <Topbar title="Edit project" subtitle={project?.title ?? "Project not found"} />
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to="/projects"><ChevronLeft className="mr-1 h-4 w-4" /> Back to projects</Link>
        </Button>
        {!project ? (
          <EmptyState icon={FolderKanban} title="Project not found" description="It may have been deleted." />
        ) : (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Project details</CardTitle>
              <CardDescription>Update the fields and save your changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectForm
                initial={project}
                submitLabel="Save changes"
                onSubmit={(v) => {
                  updateProject(project.id, v);
                  toast.success("Project updated");
                  navigate({ to: "/projects", replace: true });
                }}
              />
            </CardContent>
          </Card>
        )}
      </PageShell>
    </>
  );
}
