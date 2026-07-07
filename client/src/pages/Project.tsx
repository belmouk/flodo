import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { fetchApi } from "@/lib/utils";
import ListItem from "@/components/ListItem";
import ListsContainer from "@/components/ListsContainer";
import type {
  Project,
  List,
  Task,
} from "../../../server/generated/prisma/client";
import ListCreate from "@/components/lists/ListCreate";

const apiUrl = import.meta.env.VITE_API_URL;

export type ProjectWithLists = Project & {
  lists: (List & { tasks: Task[] })[];
};

function Project() {
  const { projectId, workspaceId } = useParams();
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["lists"],
    queryFn: async () => {
      const res = await fetchApi<ProjectWithLists>(
        `${apiUrl}/workspaces/${workspaceId}/projects/${projectId}?includes=lists,tasks`,
        "GET",
      );
      if (res.success) return res.data;
      throw res.error;
    },
  });
  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;
  console.log(data);
  return (
    <div>
      <ListCreate
        workspaceId={Number(workspaceId)}
        projectId={Number(projectId)}
      />
      <ListsContainer className="flex gap-4">
        {data.lists.map((list) => (
          <ListItem
            key={list.id}
            list={list}
            workspaceId={Number(workspaceId)}
            projectId={Number(projectId)}
          ></ListItem>
        ))}
      </ListsContainer>
    </div>
  );
}

export default Project;
