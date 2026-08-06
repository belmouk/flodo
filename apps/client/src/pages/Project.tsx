import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { fetchApi } from "@/lib/utils";
import ListItem from "@/components/ListItem";
import ListsContainer from "@/components/ListsContainer";
import type { Project as PrismaProject, List, Task } from "@repo/db";
import ListCreate from "@/components/lists/ListCreate";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import type { ApiError } from "@repo/utils";
import { toast } from "sonner";

export type ProjectWithLists = PrismaProject & {
  lists: (List & { tasks: Task[] })[];
};

type TaskPositionMutationType = {
  taskId: number;
  location: { before: number | null; after: number | null };
  listId: number;
};

function Project() {
  const { projectId, workspaceId } = useParams();
  const queryClient = useQueryClient();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const { isPending, isError, data, error } = useQuery({
    queryKey: ["lists", Number(projectId)],
    queryFn: async () => {
      const res = await fetchApi<ProjectWithLists>(
        `/projects/${projectId}?includes=lists,tasks`,
        "GET",
      );
      if (res.success) return res.data;
      throw res.error;
    },
  });

  const mutation = useMutation({
    mutationFn: async ({
      taskId,
      location,
      listId,
    }: TaskPositionMutationType) => {
      const result = await fetchApi<Task>(`/tasks/${taskId}`, "PATCH", {
        listId,
        location,
      });
      if (!result.success) throw result.error;
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["lists", Number(projectId)],
      });
    },
    onError: (error: ApiError) => {
      toast.error(error.message);
    },
  });

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;

  const parseId = (idStr: string | number) =>
    Number(idStr.toString().replace("task-", "").replace("list-", ""));

  return (
    <div>
      <ListCreate
        workspaceId={Number(workspaceId)}
        projectId={Number(projectId)}
      />
      <DragDropProvider
        onDragStart={(event) => {
          const sourceElement = event.operation.source;
          setActiveTaskId(sourceElement?.id.toString() || null);
        }}
        onDragOver={(event) => {
          const { source, target } = event.operation;
          if (!target || !source || !isSortable(source)) return;

          const sourceGroupId = source.group?.toString();
          const targetGroupId = isSortable(target)
            ? target.group?.toString()
            : target.id.toString();

          if (
            !sourceGroupId ||
            !targetGroupId ||
            sourceGroupId === targetGroupId
          )
            return;

          const sourceListId = parseId(sourceGroupId);
          const targetListId = parseId(targetGroupId);

          queryClient.setQueryData(
            ["lists", Number(projectId)],
            (old: ProjectWithLists | undefined) => {
              if (!old) return old;

              const sourceList = old.lists.find((l) => l.id === sourceListId);
              const targetList = old.lists.find((l) => l.id === targetListId);
              if (!sourceList || !targetList) return old;

              const sourceTasks = [...sourceList.tasks];
              const targetTasks = [...targetList.tasks];

              const taskIndex = sourceTasks.findIndex(
                (t) => `task-${t.id}` === source.id,
              );
              if (taskIndex === -1) return old;

              const [movedTask] = sourceTasks.splice(taskIndex, 1);
              targetTasks.splice(source.index, 0, movedTask);

              return {
                ...old,
                lists: old.lists.map((l) => {
                  if (l.id === sourceListId)
                    return { ...l, tasks: sourceTasks };
                  if (l.id === targetListId)
                    return { ...l, tasks: targetTasks };
                  return l;
                }),
              };
            },
          );
        }}
        onDragEnd={(event) => {
          setActiveTaskId(null);
          if (event.canceled) return;

          const { source, target } = event.operation;
          if (!target || !source || !isSortable(source) || !source.group)
            return;

          const taskId = parseId(source.id);
          const targetListId = parseId(source.group);

          const serverSnapshot = queryClient.getQueryData<ProjectWithLists>([
            "lists",
            Number(projectId),
          ]);
          if (!serverSnapshot) return;

          const targetListSnapshot = serverSnapshot.lists.find(
            (l) => l.id === targetListId,
          );
          if (!targetListSnapshot) return;

          const cleanTargetTasks = targetListSnapshot.tasks.filter(
            (t) => t.id !== taskId,
          );
          const destinationIndex = source.index;

          let beforeId: number | null;
          let afterId: number | null;

          if (cleanTargetTasks.length === 0) {
            beforeId = null;
            afterId = null;
          } else if (destinationIndex === 0) {
            beforeId = null;
            afterId = cleanTargetTasks[0].id;
          } else if (destinationIndex >= cleanTargetTasks.length) {
            beforeId = cleanTargetTasks[cleanTargetTasks.length - 1].id;
            afterId = null;
          } else {
            beforeId = cleanTargetTasks[destinationIndex - 1].id;
            afterId = cleanTargetTasks[destinationIndex].id;
          }

          mutation.mutate({
            taskId,
            listId: targetListId,
            location: {
              before: beforeId,
              after: afterId,
            },
          });
        }}
      >
        <ListsContainer className="flex gap-4">
          {data.lists.map((list) => (
            <ListItem
              key={list.id}
              list={list}
              workspaceId={Number(workspaceId)}
              projectId={Number(projectId)}
            />
          ))}
        </ListsContainer>

        <DragOverlay>
          {activeTaskId ? (
            <div className="p-3 bg-white border border-gray-300 shadow-xl rounded opacity-90 pointer-events-none min-w-50">
              <p className="text-sm font-medium text-gray-500">
                Moving task...
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DragDropProvider>
    </div>
  );
}

export default Project;
