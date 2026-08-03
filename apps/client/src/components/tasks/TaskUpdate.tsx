import ResourceChange from "../ResourceChange";
import { TaskUpdateSchema } from "@repo/types";
import { useOutletContext } from "react-router";
import type { User } from "@repo/db";
import { CirclePlus, SquarePen } from "lucide-react";

interface TaskUpdateProps {
  workspaceId: number;
  projectId: number;
  listId: number;
  taskId: number;
}

function TaskUpdate({ taskId, projectId, listId }: TaskUpdateProps) {
  const user = useOutletContext<Omit<User, "password">>();
  return (
    <ResourceChange
      HTTPRequest={{
        method: "PATCH",
        url: `/tasks/${taskId}`,
        itemId: taskId,
        parentId: listId,
      }}
      schema={TaskUpdateSchema}
      cleanInput={{
        title: "",
        description: "",
        dueAt: "",
        assigneeId: user.id,
      }}
      queryKeysToInvalidate={["lists", projectId]}
      fields={[
        { label: "title", type: "string" },
        { label: "description", type: "string" },
        { label: "dueAt", type: "date" },
      ]}
      resource="task"
      CreateIcon={<CirclePlus className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
    />
  );
}

export default TaskUpdate;
