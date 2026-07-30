import TaskChange from "./TaskChange";

type TaskCreateProps = {
  workspaceId: number;
  projectId: number;
  listId: number;
};

function TaskCreate({ workspaceId, projectId, listId }: TaskCreateProps) {
  return (
    <TaskChange
      HTTPMethod="POST"
      workspaceId={workspaceId}
      projectId={projectId}
      listId={listId}
    />
  );
}

export default TaskCreate;
