import type React from "react";
import type { List, Task } from "@repo/db";
import ControlPanel from "./ControlPanel";
import ListUpdate from "./lists/ListUpdate";
import ListDelete from "./lists/ListDelete";
import TaskCreate from "./tasks/TaskCreate";
import { useDroppable } from "@dnd-kit/react";
import { CollisionPriority } from "@dnd-kit/abstract";
import TaskItem from "./TaskItem";

type ListItemProps = React.ComponentProps<"div"> & {
  list: List & { tasks: Task[] };
  workspaceId: number;
  projectId: number;
};

function ListItem({ workspaceId, projectId, list }: ListItemProps) {
  const containerId = `list-${list.id}`;

  const { isDropTarget, ref } = useDroppable({
    id: containerId,
    type: "list",
    accept: "task",
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      className={`w-64 border rounded flex flex-col p-2 bg-slate-50 ${
        isDropTarget ? "bg-emerald-100 border-emerald-400" : "border-gray-200"
      }`}
      ref={ref}
    >
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="font-semibold text-gray-700">{list.name}</h3>
        <ControlPanel>
          <ListUpdate
            workspaceId={workspaceId}
            projectId={projectId}
            listId={list.id}
          />
          <ListDelete projectId={projectId} listId={list.id} />
        </ControlPanel>
      </div>

      <ul className="flex flex-col gap-2 grow min-h-37.5">
        {list.tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            workspaceId={workspaceId}
            projectId={projectId}
            listId={list.id}
            index={index}
            id={`task-${task.id}`}
            column={containerId}
          />
        ))}
      </ul>

      <div className="mt-2 pt-2 border-t border-gray-200">
        <TaskCreate
          workspaceId={workspaceId}
          projectId={projectId}
          listId={list.id}
        />
      </div>
    </div>
  );
}

export default ListItem;
