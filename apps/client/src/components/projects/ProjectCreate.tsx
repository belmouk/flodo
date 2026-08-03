import ResourceChange from "../ResourceChange";
import { ProjectSchema } from "@repo/types";
import { FilePlusCorner, SquarePen } from "lucide-react";

interface ProjectCreateProps {
  workspaceId: number;
}

function ProjectCreate({ workspaceId }: ProjectCreateProps) {
  return (
    <ResourceChange
      HTTPRequest={{
        method: "POST",
        url: `/workspaces/${workspaceId}/projects`,
      }}
      schema={ProjectSchema}
      cleanInput={{ name: "" }}
      queryKeysToInvalidate={["workspace", workspaceId.toString()]}
      fields={[{ label: "name", type: "string" }]}
      resource="project"
      CreateIcon={<FilePlusCorner className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
    />
  );
}

export default ProjectCreate;
