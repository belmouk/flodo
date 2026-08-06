import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { TooltipTrigger, Tooltip, TooltipContent } from "../ui/tooltip";
import type { ApiError } from "@repo/utils";
import { toast } from "sonner";

interface WorkspaceDeleteProps {
  workspaceId: number;
}

function WorkspaceDelete({ workspaceId }: WorkspaceDeleteProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteWorkspace = useMutation({
    mutationFn: async () => {
      const result = await fetchApi<undefined>(
        `/workspaces/${workspaceId}`,
        "DELETE",
      );
      if (result.success) return;
      throw result.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      await navigate("/workspaces");
    },
    onError(error: ApiError) {
      if (error.status === 401) {
        return navigate("/login");
      } else {
        toast.error(error.message);
      }
    },
  });

  const handleClick = () => {
    deleteWorkspace.mutate();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="hover:cursor-pointer"
          disabled={deleteWorkspace.isPending}
          onClick={handleClick}
          variant={"ghost"}
        >
          <Trash2 className="size-6 text-red-500" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Delete</TooltipContent>
    </Tooltip>
  );
}

export default WorkspaceDelete;
