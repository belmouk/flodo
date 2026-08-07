import type { Task } from "@repo/db";
import ControlPanel from "./ControlPanel";
import TaskUpdate from "./tasks/TaskUpdate";
import TaskDelete from "./tasks/TaskDelete";
import { useSortable } from "@dnd-kit/react/sortable";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import type { ApiError } from "@repo/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import type { ProjectWithListsAndMembers } from "@/pages/Project";

type TaskItemProps = {
  task: Task;
  workspaceId: number;
  projectId: number;
  listId: number;
  index: number;
  id: string;
  column: string;
};

function TaskItem({
  task,
  workspaceId,
  projectId,
  listId,
  index,
  id,
  column,
}: TaskItemProps) {
  const { ref, isDragging } = useSortable({
    id,
    index,
    type: "task",
    accept: "task",
    group: column,
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: async (status: "WIP" | "DONE") => {
      const result = await fetchApi(`/tasks/${task.id}`, "PATCH", {
        status,
      });
      if (!result.success) throw result.error;
    },
    onMutate: async (status, context) => {
      context.client.cancelQueries({ queryKey: ["lists", String(projectId)] });

      const previousProject =
        context.client.getQueryData<ProjectWithListsAndMembers>([
          "lists",
          String(projectId),
        ]);

      context.client.setQueryData(
        ["lists", String(projectId)],
        (old: ProjectWithListsAndMembers | undefined) => {
          if (!old) return;

          for (const list of old.lists) {
            if (list.id === listId) {
              for (const ts of list.tasks) {
                if (ts.id === task.id) {
                  ts.status = status;
                  break;
                }
              }
              break;
            }
          }
        },
      );

      return { previousProject };
    },
    onError: (error: ApiError, _, onMutateResult, context) => {
      context.client.setQueryData(
        ["lists", String(projectId)],
        onMutateResult?.previousProject,
      );
      if (error.status === 401) {
        return navigate("/login");
      } else if (error.status === 400) {
        toast.error(error.details[0]);
      } else {
        toast.error(error.message);
      }
    },
    onSettled: async (_, __, ___, ____, context) => {
      await context.client.invalidateQueries({
        queryKey: ["lists", String(projectId)],
      });
    },
  });

  const getTaskStatus = (taskId: number, listId: number) => {
    const project = queryClient.getQueryData<ProjectWithListsAndMembers>([
      "lists",
      String(projectId),
    ]);
    if (!project) return undefined;
    for (const list of project.lists) {
      if (list.id === listId) {
        for (const ts of list.tasks) {
          if (ts.id === taskId) {
            return task.status;
          }
        }
        break;
      }
    }
  };

  const handleChange = (checked: boolean) => {
    const status = checked ? "DONE" : "WIP";

    mutation.mutate(status);
  };

  return (
    <li
      className={`flex justify-between items-center p-3 bg-white border border-gray-200 rounded shadow-sm hover:border-gray-300 transition-colors ${
        isDragging ? "opacity-40 border-dashed border-sky-400 bg-sky-50" : ""
      }`}
      ref={ref}
      data-dragging={isDragging}
    >
      <div className="flex justify-center items-center gap-2">
        <Checkbox
          name="status"
          onCheckedChange={handleChange}
          checked={getTaskStatus(task.id, listId) === "DONE" ? true : false}
        />
        <div className="font-medium text-sm text-gray-800 truncate mr-2">
          {task.title}
        </div>
      </div>
      <div className="shrink-0">
        <ControlPanel>
          <TaskUpdate
            workspaceId={workspaceId}
            listId={listId}
            projectId={projectId}
            taskId={task.id}
          />
          <TaskDelete projectId={projectId} taskId={task.id} />
        </ControlPanel>
      </div>
    </li>
  );
}

export default TaskItem;
