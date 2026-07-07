import type React from "react";
import type { List, Task } from "../../../server/generated/prisma/client";
import TaskItem from "./task";
import ControlPanel from "./controlPanel";
import ListUpdate from "./lists/ListUpdate";
import ListDelete from "./lists/ListDelete";

type ListItemProps = React.ComponentProps<"li"> & {
  list: List & { tasks: Task[] };
  workspaceId: number;
  projectId: number;
};

function ListItem({ workspaceId, projectId, list }: ListItemProps) {
  return (
    <li className="w-48 border">
      <ul className="flex justify-between border items-center">
        <li>{list.name}</li>
        <li>
          <ControlPanel>
            <ListUpdate
              workspaceId={workspaceId}
              projectId={projectId}
              listId={list.id}
            />
            <ListDelete
              workspaceId={workspaceId}
              projectId={projectId}
              listId={list.id}
            />
          </ControlPanel>
        </li>
      </ul>
      <ul>
        {list.tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
        <li>Add task</li>
      </ul>
    </li>
  );
}
export default ListItem;
