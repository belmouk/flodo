import ResourceChange from "../ResourceChange";
import { WorkspaceSchema } from "@repo/types";
import { FolderPlus, SquarePen } from "lucide-react";

interface WorkspaceUpdateProps {
  workspaceId: number;
}

function WorkspaceUpdate({ workspaceId }: WorkspaceUpdateProps) {
  return (
    <ResourceChange
      HTTPRequest={{
        method: "PUT",
        url: `/workspaces/${workspaceId}`,
        itemId: workspaceId,
      }}
      schema={WorkspaceSchema}
      cleanInput={{ name: "" }}
      queryKeysToInvalidate={["workspaces"]}
      fields={[{ label: "name", type: "string" }]}
      CreateIcon={<FolderPlus className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
      resource="workspace"
    />
  );
}

export default WorkspaceUpdate;
