import type { Task } from "../../../server/generated/prisma/client";
import ControlPanel from "./controlPanel";
import TaskUpdate from "./tasks/TaskUpdate";
import TaskDelete from "./tasks/TaskDelete";

type TaskItemProps = {
  task: Task;
  workspaceId: number;
  projectId: number;
  listId: number;
};

function TaskItem({ task, workspaceId, projectId, listId }: TaskItemProps) {
  return (
    <li className="flex justify-between items-center">
      <div>{task.title}</div>
      <ControlPanel>
        <TaskUpdate
          workspaceId={workspaceId}
          listId={listId}
          projectId={projectId}
          taskId={task.id}
        />
        <TaskDelete
          workspaceId={workspaceId}
          listId={listId}
          projectId={projectId}
          taskId={task.id}
        />
      </ControlPanel>
    </li>
  );
}

export default TaskItem;
