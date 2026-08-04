import ResourceChange from "../ResourceChange";
import { ListSchema } from "@repo/types";
import { CirclePlus, SquarePen } from "lucide-react";

type ListCreateProps = { workspaceId: string; projectId: string };

function ListCreate({ workspaceId, projectId }: ListCreateProps) {
  const cleanInput = { name: "" };
  return (
    <ResourceChange<typeof cleanInput>
      HTTPRequest={{
        method: "POST",
        url: `/workspaces/${workspaceId}/projects/${projectId}/lists`,
      }}
      schema={ListSchema}
      cleanInput={cleanInput}
      queryKeysToInvalidate={["lists", projectId]}
      fields={[{ label: "name", type: "text" }]}
      resource="list"
      CreateIcon={<CirclePlus className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
    />
  );
}

export default ListCreate;
