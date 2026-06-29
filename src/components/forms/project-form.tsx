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
import type { Project, ProjectStatus } from "@/lib/store";

const schema = z
  .object({
    title: z.string().trim().min(2, "Title is too short").max(120),
    description: z.string().trim().max(2000),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    status: z.enum(["Planning", "Active", "On Hold", "Completed"] as const),
  })
  .refine((v) => v.endDate >= v.startDate, { message: "End date must be after start date", path: ["endDate"] });

export type ProjectFormValues = z.infer<typeof schema>;

const STATUSES: ProjectStatus[] = ["Planning", "Active", "On Hold", "Completed"];

export function ProjectForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<Project>;
  onSubmit: (v: ProjectFormValues) => Promise<void> | void;
  submitLabel: string;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      startDate: initial?.startDate ?? today,
      endDate: initial?.endDate ?? today,
      status: (initial?.status as ProjectStatus) ?? "Planning",
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
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...form.register("startDate")} />
          {form.formState.errors.startDate && <p className="text-xs text-destructive">{form.formState.errors.startDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" type="date" {...form.register("endDate")} />
          {form.formState.errors.endDate && <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as ProjectStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
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
