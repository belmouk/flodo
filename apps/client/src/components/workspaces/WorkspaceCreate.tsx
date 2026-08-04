import { WorkspaceSchema } from "@repo/types";
import ResourceChange from "../ResourceChange";
import { FolderPlus, SquarePen } from "lucide-react";

function WorkspaceCreate() {
  const cleanInput = { name: "" };
  return (
    <ResourceChange<typeof cleanInput>
      HTTPRequest={{ method: "POST", url: "/workspaces" }}
      schema={WorkspaceSchema}
      cleanInput={cleanInput}
      queryKeysToInvalidate={["workspaces"]}
      fields={[{ label: "name", type: "text" }]}
      resource="workspace"
      CreateIcon={<FolderPlus className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
    />
  );
}

export default WorkspaceCreate;
