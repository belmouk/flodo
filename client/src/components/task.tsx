import type { Task } from "../../../server/generated/prisma/client";

type TaskItemProps = { task: Task };

function TaskItem({ task }: TaskItemProps) {
  return <li>{task.title}</li>;
}

export default TaskItem;
