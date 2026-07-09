import type React from "react";
import type { List, Task } from "../../../server/generated/prisma/client";
import TaskItem from "./taskItem";
import ControlPanel from "./controlPanel";
import ListUpdate from "./lists/ListUpdate";
import ListDelete from "./lists/ListDelete";
import TaskCreate from "./tasks/TaskCreate";

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
          <TaskItem
            key={task.id}
            task={task}
            workspaceId={workspaceId}
            projectId={projectId}
            listId={list.id}
          />
        ))}
        <li className="flex justify-center my-6">
          <TaskCreate
            workspaceId={workspaceId}
            projectId={projectId}
            listId={list.id}
          />
        </li>
      </ul>
    </li>
  );
}
export default ListItem;
