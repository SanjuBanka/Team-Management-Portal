import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { Task, TaskPriority, TaskStatus, Project, User } from "@/lib/store";

const schema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(150),
  description: z.string().trim().max(2000),
  projectId: z.string().min(1, "Select a project"),
  assigneeId: z.string().min(1, "Select an assignee"),
  priority: z.enum(["Low", "Medium", "High"] as const),
  status: z.enum(["Pending", "In Progress", "Completed"] as const),
  dueDate: z.string().min(1, "Due date is required"),
});

export type TaskFormValues = z.infer<typeof schema>;

const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];
const STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];

export function TaskForm({
  initial,
  projects,
  users,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<Task>;
  projects: Project[];
  users: User[];
  onSubmit: (v: TaskFormValues) => Promise<void> | void;
  submitLabel: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      projectId: initial?.projectId ?? projects[0]?.id ?? "",
      assigneeId: initial?.assigneeId ?? users[0]?.id ?? "",
      priority: (initial?.priority as TaskPriority) ?? "Medium",
      status: (initial?.status as TaskStatus) ?? "Pending",
      dueDate: initial?.dueDate ?? today,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register("title")} />
        {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={4} {...form.register("description")} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={form.watch("projectId")} onValueChange={(v) => form.setValue("projectId", v)}>
            <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.formState.errors.projectId && <p className="text-xs text-destructive">{form.formState.errors.projectId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Assignee</Label>
          <Select value={form.watch("assigneeId")} onValueChange={(v) => form.setValue("assigneeId", v)}>
            <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
            <SelectContent>
              {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.formState.errors.assigneeId && <p className="text-xs text-destructive">{form.formState.errors.assigneeId.message}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as TaskPriority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as TaskStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...form.register("dueDate")} />
          {form.formState.errors.dueDate && <p className="text-xs text-destructive">{form.formState.errors.dueDate.message}</p>}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
