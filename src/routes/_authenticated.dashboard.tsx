import { createFileRoute, Link } from "@tanstack/react-router";
import { Topbar } from "@/components/layout/topbar";
import { PageShell } from "@/components/layout/page-shell";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, ListChecks, CheckCircle2, Clock, Plus, ArrowRight } from "lucide-react";
import { listProjects, listTasks, listUsers } from "@/lib/store";
import { useStore } from "@/lib/use-store";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ProjectStatusBadge, TaskPriorityBadge, TaskStatusBadge } from "@/components/layout/status-badge";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Smart Portal" },
      { name: "description", content: "Overview of your projects, tasks, and team activity." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const projects = useStore(() => listProjects());
  const tasks = useStore(() => listTasks());
  const users = useStore(() => listUsers());

  const completed = tasks.filter((t) => t.status === "Completed").length;
  const pending = tasks.filter((t) => t.status === "Pending").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;

  const perProject = projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.projectId === p.id);
    return {
      name: p.title.length > 14 ? p.title.slice(0, 14) + "…" : p.title,
      Completed: projectTasks.filter((t) => t.status === "Completed").length,
      "In Progress": projectTasks.filter((t) => t.status === "In Progress").length,
      Pending: projectTasks.filter((t) => t.status === "Pending").length,
    };
  });

  const pieData = [
    { name: "Completed", value: completed, color: "var(--color-chart-2)" },
    { name: "In Progress", value: inProgress, color: "var(--color-chart-1)" },
    { name: "Pending", value: pending, color: "var(--color-chart-3)" },
  ];

  const upcoming = [...tasks]
    .filter((t) => t.status !== "Completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="A snapshot of everything happening across your workspace"
        actions={
          <Button asChild size="sm">
            <Link to="/projects/new">
              <Plus className="mr-1 h-4 w-4" /> New project
            </Link>
          </Button>
        }
      />
      <PageShell>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total projects" value={projects.length} icon={FolderKanban} tone="primary" />
          <StatCard label="Total tasks" value={tasks.length} icon={ListChecks} tone="info" />
          <StatCard label="Completed" value={completed} icon={CheckCircle2} tone="success" hint={`${tasks.length ? Math.round((completed / tasks.length) * 100) : 0}% done`} />
          <StatCard label="Pending" value={pending + inProgress} icon={Clock} tone="warning" hint={`${inProgress} in progress`} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tasks by project</CardTitle>
              <CardDescription>Distribution of task statuses per project</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perProject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Completed" stackId="a" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="In Progress" stackId="a" fill="var(--color-chart-1)" />
                  <Bar dataKey="Pending" stackId="a" fill="var(--color-chart-3)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status breakdown</CardTitle>
              <CardDescription>All tasks across all projects</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming tasks</CardTitle>
                <CardDescription>Soonest due, not yet completed</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/tasks">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming tasks.</p>}
              {upcoming.map((t) => {
                const assignee = users.find((u) => u.id === t.assigneeId);
                return (
                  <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        Due {format(new Date(t.dueDate), "MMM d")} · {assignee?.name ?? "Unassigned"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <TaskPriorityBadge priority={t.priority} />
                      <TaskStatusBadge status={t.status} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active projects</CardTitle>
                <CardDescription>Most recent projects in your workspace</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/projects">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {projects.slice(0, 5).map((p) => {
                const projectTasks = tasks.filter((t) => t.projectId === p.id);
                const done = projectTasks.filter((t) => t.status === "Completed").length;
                const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
                return (
                  <div key={p.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && <p className="text-sm text-muted-foreground">No projects yet.</p>}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </>
  );
}
