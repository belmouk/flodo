import ResourceChange from "../ResourceChange";
import { ListSchema } from "@repo/types";
import { CirclePlus, SquarePen } from "lucide-react";

interface ListUpdateProps {
  projectId: number;
  listId: number;
}

function ListUpdate({ projectId, listId }: ListUpdateProps) {
  return (
    <ResourceChange
      HTTPRequest={{
        method: "PUT",
        url: `/lists/${listId}`,
        itemId: listId,
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

export default ListUpdate;
