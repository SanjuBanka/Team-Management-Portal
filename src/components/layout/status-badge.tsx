import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/store";

const projectMap: Record<ProjectStatus, string> = {
  Planning: "bg-info/15 text-info border-info/30",
  Active: "bg-primary/15 text-primary border-primary/30",
  "On Hold": "bg-warning/15 text-warning-foreground border-warning/40 dark:text-warning",
  Completed: "bg-success/15 text-success border-success/30",
};

const taskMap: Record<TaskStatus, string> = {
  Pending: "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-info/15 text-info border-info/30",
  Completed: "bg-success/15 text-success border-success/30",
};

const priorityMap: Record<TaskPriority, string> = {
  Low: "bg-muted text-muted-foreground border-border",
  Medium: "bg-warning/15 text-warning-foreground border-warning/40 dark:text-warning",
  High: "bg-destructive/15 text-destructive border-destructive/30",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant="outline" className={cn("font-medium", projectMap[status])}>{status}</Badge>;
}
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant="outline" className={cn("font-medium", taskMap[status])}>{status}</Badge>;
}
export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge variant="outline" className={cn("font-medium", priorityMap[priority])}>{priority}</Badge>;
}
