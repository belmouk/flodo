import ListChange from "./ListChange";

interface ListUpdateProps {
  workspaceId: number;
  projectId: number;
  listId: number;
}

function ListUpdate({ workspaceId, projectId, listId }: ListUpdateProps) {
  return (
    <ListChange
      HTTPMethod="PUT"
      workspaceId={workspaceId}
      projectId={projectId}
      listId={listId}
    />
  );
}

export default ListUpdate;
