import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import { useNavigate, useParams } from "react-router";
import { Button } from "../ui/button";
import type React from "react";
import { Trash2 } from "lucide-react";
import { TooltipTrigger, Tooltip, TooltipContent } from "../ui/tooltip";

interface ApiError {
  message?: string;
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

const apiUrl = import.meta.env.VITE_API_URL;

function WorkspaceDelete({ ...props }: React.ComponentProps<"button">) {
  let navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspaceId } = useParams();
  const deleteWorkspace = useMutation({
    mutationFn: async (workspaceId: number) => {
      const result = await fetchApi<undefined>(
        `${apiUrl}/workspaces/${workspaceId}`,
        "DELETE",
      );
      if (result.success) return;
      throw result.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      navigate("/workspaces");
    },
    onError(error: ApiError) {
      if (error.status === 401) return navigate("/login");
    },
  });

  const handleClick = () => {
    if (workspaceId) {
      const id = parseInt(workspaceId, 10);
      deleteWorkspace.mutate(id);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="hover:cursor-pointer"
          disabled={deleteWorkspace.isPending}
          onClick={handleClick}
          {...props}
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
