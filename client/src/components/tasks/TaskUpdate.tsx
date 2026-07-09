import TaskChange from "./TaskChange";

interface TaskUpdateProps {
  workspaceId: number;
  projectId: number;
  listId: number;
  taskId: number;
}

function TaskUpdate({
  workspaceId,
  projectId,
  listId,
  taskId,
}: TaskUpdateProps) {
  return (
    <TaskChange
      HTTPMethod="PUT"
      workspaceId={workspaceId}
      projectId={projectId}
      listId={listId}
      taskId={taskId}
    />
  );
}

export default TaskUpdate;
