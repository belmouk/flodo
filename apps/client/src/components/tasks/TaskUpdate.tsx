import ResourceChange from "../ResourceChange";
import { TaskUpdateSchema } from "@repo/types";
import { useOutletContext } from "react-router";
import type { User } from "@repo/db";
import { CirclePlus, SquarePen } from "lucide-react";

interface TaskUpdateProps {
  projectId: string;
  listId: string;
  taskId: string;
}

function TaskUpdate({ taskId, projectId, listId }: TaskUpdateProps) {
  const user = useOutletContext<Omit<User, "password">>();
  const cleanInput = {
    title: "",
    description: "",
    dueAt: "",
    assigneeId: String(user.id),
  };
  return (
    <ResourceChange<typeof cleanInput>
      HTTPRequest={{
        method: "PATCH",
        url: `/tasks/${taskId}`,
        itemId: Number(taskId),
        parentId: Number(listId),
      }}
      schema={TaskUpdateSchema}
      cleanInput={cleanInput}
      queryKeysToInvalidate={["lists", projectId]}
      fields={[
        { label: "title", type: "text" },
        { label: "description", type: "text" },
        { label: "dueAt", type: "date" },
      ]}
      resource="task"
      CreateIcon={<CirclePlus className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
    />
  );
}

export default TaskUpdate;
