import ResourceChange from "../ResourceChange";
import { TaskCreationSchema } from "@repo/types";
import { useOutletContext } from "react-router";
import type { User } from "@repo/db";
import { CirclePlus, SquarePen } from "lucide-react";

type TaskCreateProps = {
  workspaceId: string;
  projectId: string;
  listId: string;
};

function TaskCreate({ workspaceId, projectId, listId }: TaskCreateProps) {
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
        method: "POST",
        url: `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks`,
      }}
      schema={TaskCreationSchema}
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

export default TaskCreate;
