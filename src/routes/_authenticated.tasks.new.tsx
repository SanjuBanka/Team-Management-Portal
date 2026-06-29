import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/forms/task-form";
import { createTask, listProjects, listUsers } from "@/lib/store";
import { useStore } from "@/lib/use-store";
import { EmptyState } from "@/components/layout/empty-state";
import { FolderKanban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks/new")({
  head: () => ({ meta: [{ title: "New task — Smart Portal" }] }),
  component: NewTaskPage,
});

function NewTaskPage() {
  const navigate = useNavigate();
  const projects = useStore(() => listProjects());
  const users = useStore(() => listUsers());

  return (
    <>
      <Topbar title="New task" subtitle="Create and assign a task" />
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to="/tasks"><ChevronLeft className="mr-1 h-4 w-4" /> Back to tasks</Link>
        </Button>
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Create a project first"
            description="Tasks need to live inside a project. Add one to continue."
            action={<Button asChild><Link to="/projects/new">Create project</Link></Button>}
          />
        ) : (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Task details</CardTitle>
              <CardDescription>Set the basics, assign someone, and pick a due date.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskForm
                projects={projects}
                users={users}
                submitLabel="Create task"
                onSubmit={(v) => {
                  createTask(v);
                  toast.success("Task created");
                  navigate({ to: "/tasks", replace: true });
                }}
              />
            </CardContent>
          </Card>
        )}
      </PageShell>
    </>
  );
}
