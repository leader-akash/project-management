import ProjectClient from "./project-client";

export default async function ProjectPage({ params }) {
  const resolvedParams = await params;
  return <ProjectClient projectId={resolvedParams.projectId} />;
}

