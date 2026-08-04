import ResourceChange from "../ResourceChange";
import { ListSchema } from "@repo/types";
import { CirclePlus, SquarePen } from "lucide-react";

interface ListUpdateProps {
  projectId: string;
  listId: string;
}

function ListUpdate({ projectId, listId }: ListUpdateProps) {
  const cleanInput = { name: "" };
  return (
    <ResourceChange<typeof cleanInput>
      HTTPRequest={{
        method: "PUT",
        url: `/lists/${listId}`,
        itemId: Number(listId),
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

export default ListUpdate;
