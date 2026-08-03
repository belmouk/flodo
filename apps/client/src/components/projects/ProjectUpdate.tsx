import { ProjectSchema } from "@repo/types";
import { FilePlusCorner, SquarePen } from "lucide-react";
import ResourceChange from "../ResourceChange";

interface ProjectUpdateProps {
  projectId: number;
  workspaceId: number;
}

function ProjectUpdate({ projectId, workspaceId }: ProjectUpdateProps) {
  return (
    <ResourceChange
      HTTPRequest={{
        method: "PUT",
        url: `/projects/${projectId}`,
        itemId: projectId,
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

export default ProjectUpdate;
