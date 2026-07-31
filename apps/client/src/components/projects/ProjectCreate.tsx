import ProjectChange from "./ProjectChange";

interface ProjectCreateProps {
  workspaceId: number;
}

function ProjectCreate({ workspaceId }: ProjectCreateProps) {
  return <ProjectChange HTTPMethod="POST" workspaceId={workspaceId} />;
}

export default ProjectCreate;
