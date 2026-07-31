import ProjectChange from "./ProjectChange";

interface ProjectUpdateProps {
  projectId: number;
  workspaceId: number;
}

function ProjectUpdate({ projectId, workspaceId }: ProjectUpdateProps) {
  return (
    <ProjectChange
      HTTPMethod="PUT"
      projectId={projectId}
      workspaceId={workspaceId}
    />
  );
}

export default ProjectUpdate;
