import ResourceChange from "../ResourceChange";
import { ProjectSchema } from "@repo/types";
import { FilePlusCorner, SquarePen } from "lucide-react";

interface ProjectCreateProps {
  workspaceId: string;
}

function ProjectCreate({ workspaceId }: ProjectCreateProps) {
  const cleanInput = { name: "" };
  return (
    <ResourceChange<typeof cleanInput>
      HTTPRequest={{
        method: "POST",
        url: `/workspaces/${workspaceId}/projects`,
      }}
      schema={ProjectSchema}
      cleanInput={cleanInput}
      queryKeysToInvalidate={["workspace", workspaceId]}
      fields={[{ label: "name", type: "text" }]}
      resource="project"
      CreateIcon={<FilePlusCorner className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
    />
  );
}

export default ProjectCreate;
