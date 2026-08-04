import ResourceChange from "../ResourceChange";
import { WorkspaceSchema } from "@repo/types";
import { FolderPlus, SquarePen } from "lucide-react";

interface WorkspaceUpdateProps {
  workspaceId: string;
}

function WorkspaceUpdate({ workspaceId }: WorkspaceUpdateProps) {
  const cleanInput = { name: "" };
  return (
    <ResourceChange<typeof cleanInput>
      HTTPRequest={{
        method: "PUT",
        url: `/workspaces/${workspaceId}`,
        itemId: Number(workspaceId),
      }}
      schema={WorkspaceSchema}
      cleanInput={cleanInput}
      queryKeysToInvalidate={["workspaces"]}
      fields={[{ label: "name", type: "text" }]}
      CreateIcon={<FolderPlus className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
      resource="workspace"
    />
  );
}

export default WorkspaceUpdate;
