import ListChange from "./ListChange";

type ListCreateProps = { workspaceId: number; projectId: number };

function ListCreate({ workspaceId, projectId }: ListCreateProps) {
  return (
    <ListChange
      HTTPMethod="POST"
      workspaceId={workspaceId}
      projectId={projectId}
    />
  );
}

export default ListCreate;
