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
import { FolderKanban, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteProject, listProjects, listTasks } from "@/lib/store";
import { useStore } from "@/lib/use-store";
import { ProjectStatusBadge } from "@/components/layout/status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Smart Portal" },
      { name: "description", content: "Browse, search, and manage all your projects." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = useStore(() => listProjects());
  const tasks = useStore(() => listTasks());
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.status.toLowerCase().includes(q),
    );
  }, [projects, query]);

  const handleDelete = (id: string, title: string) => {
    deleteProject(id);
    toast.success(`Deleted "${title}"`);
  };

  return (
    <>
      <Topbar
        title="Projects"
        subtitle="Plan, organize, and track every project in one place"
        actions={
          <Button asChild size="sm">
            <Link
              to="/projects/new"
              onClick={(e) => {
                try {
                  console.log("New project link clicked", { href: "/projects/new" });
                } catch (err) {
                  /* ignore */
                }
              }}
              data-debug="new-project-link"
            >
              <Plus className="mr-1 h-4 w-4" /> New project
            </Link>
          </Button>
        }
      />
      <PageShell>
        <Card>
          <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All projects</CardTitle>
              <CardDescription>{filtered.length} of {projects.length} shown</CardDescription>
            </div>
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title={projects.length === 0 ? "No projects yet" : "No projects match your search"}
                description={projects.length === 0 ? "Create your first project to start tracking work." : "Try a different keyword."}
                action={
                    projects.length === 0 ? (
                    <Button asChild>
                      <Link
                        to="/projects/new"
                        onClick={(e) => {
                          try {
                            console.log("New project (empty state) link clicked", { href: "/projects/new" });
                          } catch (err) {
                            /* ignore */
                          }
                        }}
                        data-debug="new-project-link-empty"
                      >
                        <Plus className="mr-1 h-4 w-4" /> New project
                      </Link>
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => {
                      const projectTasks = tasks.filter((t) => t.projectId === p.id);
                      const done = projectTasks.filter((t) => t.status === "Completed").length;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="min-w-[220px]">
                            <div className="font-medium">{p.title}</div>
                            <div className="line-clamp-1 text-xs text-muted-foreground">{p.description}</div>
                          </TableCell>
                          <TableCell><ProjectStatusBadge status={p.status} /></TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {format(new Date(p.startDate), "MMM d")} – {format(new Date(p.endDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">{done}/{projectTasks.length}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button asChild variant="ghost" size="icon" aria-label="Edit">
                                <Link to="/projects/$projectId/edit" params={{ projectId: p.id }}>
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
                                    <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{p.title}" and all of its tasks will be permanently removed.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(p.id, p.title)}>Delete</AlertDialogAction>
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
