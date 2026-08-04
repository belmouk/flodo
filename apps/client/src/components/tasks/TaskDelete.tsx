import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import { useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { TooltipTrigger, Tooltip, TooltipContent } from "../ui/tooltip";
import type { ApiError } from "@repo/utils";
import { toast } from "sonner";

interface TaskDeleteProps {
  projectId: string;
  taskId: string;
}

function TaskDelete({ projectId, taskId }: TaskDeleteProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await fetchApi<undefined>(`/tasks/${taskId}`, "DELETE");
      if (result.success) return;
      throw result.error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lists", projectId] });
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
    mutation.mutate();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="hover:cursor-pointer"
          disabled={mutation.isPending}
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

export default TaskDelete;
