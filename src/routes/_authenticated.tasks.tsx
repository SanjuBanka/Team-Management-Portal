import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ListChecks, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteTask, listProjects, listTasks, listUsers, updateTask, type TaskStatus } from "@/lib/store";
import { useStore } from "@/lib/use-store";
import { TaskPriorityBadge, TaskStatusBadge } from "@/components/layout/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks — Smart Portal" },
      { name: "description", content: "Track, assign, and update every task across your projects." },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const tasks = useStore(() => listTasks());
  const projects = useStore(() => listProjects());
  const users = useStore(() => listUsers());

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
      if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, query, statusFilter, projectFilter]);

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask(id, { status });
    toast.success("Status updated");
  };
  const handleDelete = (id: string, title: string) => {
    deleteTask(id);
    toast.success(`Deleted "${title}"`);
  };

  return (
    <>
      <Topbar
        title="Tasks"
        subtitle="Everything assigned, in progress, or due across your team"
        actions={
          <Button asChild size="sm">
            <Link to="/tasks/new"><Plus className="mr-1 h-4 w-4" /> New task</Link>
          </Button>
        }
      />
      <PageShell>
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All tasks</CardTitle>
                <CardDescription>{filtered.length} of {tasks.length} shown</CardDescription>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search tasks…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState
                icon={ListChecks}
                title={tasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
                description={tasks.length === 0 ? "Create your first task to get started." : "Try clearing filters or changing your search."}
                action={
                  tasks.length === 0 ? (
                    <Button asChild><Link to="/tasks/new"><Plus className="mr-1 h-4 w-4" /> New task</Link></Button>
                  ) : null
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => {
                      const project = projects.find((p) => p.id === t.projectId);
                      const assignee = users.find((u) => u.id === t.assigneeId);
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="min-w-[220px]">
                            <div className="font-medium">{t.title}</div>
                            <div className="line-clamp-1 text-xs text-muted-foreground">{t.description}</div>
                          </TableCell>
                          <TableCell className="text-sm">{project?.title ?? "—"}</TableCell>
                          <TableCell className="text-sm">{assignee?.name ?? "Unassigned"}</TableCell>
                          <TableCell><TaskPriorityBadge priority={t.priority} /></TableCell>
                          <TableCell>
                            <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v as TaskStatus)}>
                              <SelectTrigger className="h-8 w-[140px] border-none bg-transparent p-0 shadow-none focus:ring-0">
                                <TaskStatusBadge status={t.status} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {format(new Date(t.dueDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button asChild variant="ghost" size="icon" aria-label="Edit">
                                <Link to="/tasks/$taskId/edit" params={{ taskId: t.id }}>
                                  <Pencil className="h-4 w-4" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label="Delete">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                                    <AlertDialogDescription>"{t.title}" will be permanently removed.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(t.id, t.title)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageShell>
      <Outlet />
    </>
  );
}
