import { ProjectSchema } from "@repo/types";
import { FilePlusCorner, SquarePen } from "lucide-react";
import ResourceChange from "../ResourceChange";

interface ProjectUpdateProps {
  projectId: string;
  workspaceId: string;
}

function ProjectUpdate({ projectId, workspaceId }: ProjectUpdateProps) {
  const cleanInput = { name: "" };
  return (
    <ResourceChange<typeof cleanInput>
      HTTPRequest={{
        method: "PUT",
        url: `/projects/${projectId}`,
        itemId: Number(projectId),
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

export default ProjectUpdate;
