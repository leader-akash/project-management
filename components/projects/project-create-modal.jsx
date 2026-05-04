"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ProjectForm } from "./project-form";

export function ProjectCreateModal({ open, onOpenChange, onCreate, isSubmitting }) {
  const handleSubmit = async (values) => {
    await onCreate({
      name: values.name,
      description: values.description?.trim() ? values.description.trim() : undefined
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            A unique project key is generated automatically. You can manage members and tasks on the board after it is created.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Create project" />
      </DialogContent>
    </Dialog>
  );
}
