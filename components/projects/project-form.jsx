"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(2, "Project name is required.").max(120),
  key: z.string().max(12).optional(),
  description: z.string().max(1000).optional()
});

export function ProjectForm({ onSubmit, isSubmitting }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      key: "",
      description: ""
    }
  });

  const submit = async (values) => {
    try {
      await onSubmit(values);
      form.reset();
    } catch (_error) {
      // The parent renders the request error.
    }
  };

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <Label htmlFor="project-name">Name</Label>
          <Input id="project-name" placeholder="Platform roadmap" {...form.register("name")} />
          {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-key">Key</Label>
          <Input id="project-key" placeholder="PLAT" maxLength={12} {...form.register("key")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea id="project-description" rows={3} placeholder="Scope, outcomes, or team notes" {...form.register("description")} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create project
      </Button>
    </form>
  );
}
