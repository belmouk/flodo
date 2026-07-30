import WorkspaceChange from "./workspaceChange";

interface WorkspaceUpdateProps {
  workspaceId: number;
}

function WorkspaceUpdate({ workspaceId }: WorkspaceUpdateProps) {
  return <WorkspaceChange HTTPMethod="PUT" workspaceId={workspaceId} />;
}

export default WorkspaceUpdate;
