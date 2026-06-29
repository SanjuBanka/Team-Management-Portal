import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronLeft, ListChecks } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/forms/task-form";
import { getTask, listProjects, listUsers, updateTask } from "@/lib/store";
import { useStore } from "@/lib/use-store";
import { EmptyState } from "@/components/layout/empty-state";

export const Route = createFileRoute("/_authenticated/tasks/$taskId/edit")({
  head: () => ({ meta: [{ title: "Edit task — Smart Portal" }] }),
  component: EditTaskPage,
});

function EditTaskPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();
  const task = getTask(taskId);
  const projects = useStore(() => listProjects());
  const users = useStore(() => listUsers());

  return (
    <>
      <Topbar title="Edit task" subtitle={task?.title ?? "Task not found"} />
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to="/tasks"><ChevronLeft className="mr-1 h-4 w-4" /> Back to tasks</Link>
        </Button>
        {!task ? (
          <EmptyState icon={ListChecks} title="Task not found" description="It may have been deleted." />
        ) : (
          <Card className="max-w-3xl">
            <CardHeader>
              <CardTitle>Task details</CardTitle>
              <CardDescription>Update the fields and save your changes.</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskForm
                initial={task}
                projects={projects}
                users={users}
                submitLabel="Save changes"
                onSubmit={(v) => {
                  updateTask(task.id, v);
                  toast.success("Task updated");
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
