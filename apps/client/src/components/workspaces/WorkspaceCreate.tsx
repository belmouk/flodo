import { WorkspaceSchema } from "@repo/types";
import ResourceChange from "../ResourceChange";
import { FolderPlus, SquarePen } from "lucide-react";

function WorkspaceCreate() {
  return (
    <ResourceChange
      HTTPRequest={{ method: "POST", url: "/workspaces" }}
      schema={WorkspaceSchema}
      cleanInput={{ name: "" }}
      queryKeysToInvalidate={["workspaces"]}
      fields={[{ label: "name", type: "string" }]}
      resource="workspace"
      CreateIcon={<FolderPlus className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
    />
  );
}

export default WorkspaceCreate;
