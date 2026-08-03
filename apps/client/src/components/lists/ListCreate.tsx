import ResourceChange from "../ResourceChange";
import { ListSchema } from "@repo/types";
import { CirclePlus, SquarePen } from "lucide-react";

type ListCreateProps = { workspaceId: number; projectId: number };

function ListCreate({ workspaceId, projectId }: ListCreateProps) {
  return (
    <ResourceChange
      HTTPRequest={{
        method: "POST",
        url: `/workspaces/${workspaceId}/projects/${projectId}/lists`,
      }}
      schema={ListSchema}
      cleanInput={{ name: "" }}
      queryKeysToInvalidate={["lists", projectId]}
      fields={[{ label: "name", type: "string" }]}
      resource="list"
      CreateIcon={<CirclePlus className="size-6" />}
      UpdateIcon={<SquarePen className="size-6" />}
    />
  );
}

export default ListCreate;
