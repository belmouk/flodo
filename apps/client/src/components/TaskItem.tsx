import type { Task } from "@repo/db";
import ControlPanel from "./controlPanel";
import TaskUpdate from "./tasks/TaskUpdate";
import TaskDelete from "./tasks/TaskDelete";
import { useSortable } from "@dnd-kit/react/sortable";

type TaskItemProps = {
  task: Task;
  workspaceId: number;
  projectId: number;
  listId: number;
  index: number;
  id: string;
  column: string;
};

function TaskItem({
  task,
  workspaceId,
  projectId,
  listId,
  index,
  id,
  column,
}: TaskItemProps) {
  const { ref, isDragging } = useSortable({
    id,
    index,
    type: "task",
    accept: "task",
    group: column,
  });

  return (
    <li
      className={`flex justify-between items-center p-3 bg-white border border-gray-200 rounded shadow-sm hover:border-gray-300 transition-colors ${
        isDragging ? "opacity-40 border-dashed border-sky-400 bg-sky-50" : ""
      }`}
      ref={ref}
      data-dragging={isDragging}
    >
      <div className="font-medium text-sm text-gray-800 truncate mr-2">
        {task.title}
      </div>
      <div className="shrink-0">
        <ControlPanel>
          <TaskUpdate
            workspaceId={workspaceId}
            listId={listId}
            projectId={projectId}
            taskId={task.id}
          />
          <TaskDelete projectId={projectId} taskId={task.id} />
        </ControlPanel>
      </div>
    </li>
  );
}

export default TaskItem;
