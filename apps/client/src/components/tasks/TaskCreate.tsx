import ResourceChange from "../ResourceChange";
import { TaskCreationSchema } from "@repo/types";
import { useOutletContext } from "react-router";
import type { User } from "@repo/db";
import { CirclePlus, SquarePen } from "lucide-react";

type TaskCreateProps = {
  workspaceId: number;
  projectId: number;
  listId: number;
};

function TaskCreate({ workspaceId, projectId, listId }: TaskCreateProps) {
  const user = useOutletContext<Omit<User, "password">>();
  return (
    <ResourceChange
      HTTPRequest={{
        method: "POST",
        url: `/workspaces/${workspaceId}/projects/${projectId}/lists/${listId}/tasks`,
      }}
      schema={TaskCreationSchema}
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

export default TaskCreate;
