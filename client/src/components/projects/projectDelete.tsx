import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import type React from "react";
import { Trash2 } from "lucide-react";
import { TooltipTrigger, Tooltip, TooltipContent } from "../ui/tooltip";
import type ApiError from "../../../../server/src/lib/ApiError";

type ProjectDeleteProps = {
  projectId: number;
  workspaceId: number;
  setProjectId: React.Dispatch<React.SetStateAction<number | undefined>>;
};

const apiUrl = import.meta.env.VITE_API_URL;

function ProjectDelete({
  projectId,
  workspaceId,
  setProjectId,
}: ProjectDeleteProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteProject = useMutation({
    mutationFn: async () => {
      const result = await fetchApi<undefined>(
        `${apiUrl}/workspaces/${workspaceId}/projects/${projectId}`,
        "DELETE",
      );
      if (result.success) return;
      throw result.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["workspace", workspaceId.toString()],
      });
      setProjectId(undefined);
    },
    onError(error: ApiError) {
      if (error.status === 500) throw new Response(null, { status: 500 });
      if (error.status === 401) return navigate("/login");
    },
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="hover:cursor-pointer"
          disabled={deleteProject.isPending}
          onClick={() => {
            deleteProject.mutate();
          }}
          variant={"ghost"}
        >
          <Trash2 className="size-6 text-red-500" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete</TooltipContent>
    </Tooltip>
  );
}

export default ProjectDelete;
