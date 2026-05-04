import Link from "next/link";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectCard({ project }) {
  const memberCount = project.members?.length || 0;

  return (
    <Link href={`/projects/${project._id}`} className="block focus:outline-none focus:ring-2 focus:ring-ring">
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate">{project.name}</CardTitle>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{project.key}</p>
            </div>
            <Badge variant={project.status === "active" ? "success" : "muted"}>{project.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="line-clamp-3 min-h-12 text-sm text-muted-foreground">
            {project.description || "No description provided."}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount} members
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              Updated {new Date(project.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Open board
            <ArrowRight className="h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

