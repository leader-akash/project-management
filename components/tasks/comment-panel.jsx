"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  body: z.string().trim().min(1, "Write a comment before sending.").max(3000)
});

export function CommentPanel({ comments, onCreateComment, isSubmitting }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      body: ""
    }
  });

  const submit = async (values) => {
    try {
      await onCreateComment(values.body);
      form.reset();
    } catch (_error) {
      // The project page renders the request error.
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Comments</h3>
        <p className="text-xs text-muted-foreground">Updates appear instantly for everyone in the project.</p>
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border bg-background p-3">
        {comments.length ? (
          comments.map((comment) => (
            <article key={comment._id} className="flex gap-3">
              <Avatar name={comment.author?.name} className="h-7 w-7 text-[10px]" />
              <div className="min-w-0 flex-1 rounded-md bg-muted/60 p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-semibold">{comment.author?.name || "Unknown user"}</p>
                  <time className="shrink-0 text-[11px] text-muted-foreground">
                    {comment.isOptimistic ? "Syncing" : new Date(comment.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">{comment.body}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="flex min-h-24 items-center justify-center text-sm text-muted-foreground">No comments yet</div>
        )}
      </div>
      <form className="space-y-2" onSubmit={form.handleSubmit(submit)}>
        <Textarea rows={3} placeholder="Add a comment" {...form.register("body")} />
        {form.formState.errors.body && <p className="text-xs text-destructive">{form.formState.errors.body.message}</p>}
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Comment
        </Button>
      </form>
    </section>
  );
}
