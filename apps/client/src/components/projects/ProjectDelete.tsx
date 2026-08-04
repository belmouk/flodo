import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import type React from "react";
import { Trash2 } from "lucide-react";
import { TooltipTrigger, Tooltip, TooltipContent } from "../ui/tooltip";
import type { ApiError } from "@repo/utils";
import { toast } from "sonner";

type ProjectDeleteProps = {
  projectId: string;
  workspaceId: string;
  setProjectId: React.Dispatch<React.SetStateAction<number | undefined>>;
};

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
        `/projects/${projectId}`,
        "DELETE",
      );
      if (result.success) return;
      throw result.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["workspace", workspaceId],
      });
      setProjectId(undefined);
    },
    onError(error: ApiError) {
      if (error.status === 401) {
        return navigate("/login");
      } else {
        toast.error(error.message);
      }
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
