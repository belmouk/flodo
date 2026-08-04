import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { SquareArrowOutUpRight } from "lucide-react";
import { Link } from "react-router";

type ProjectOpenProps = {
  projectId: string;
  workspaceId: string;
};

function ProjectOpen({ projectId, workspaceId }: ProjectOpenProps) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={`/workspaces/${workspaceId}/projects/${projectId}`}
            className="px-2.5"
          >
            <SquareArrowOutUpRight className="size-6" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Open</TooltipContent>
      </Tooltip>
    </>
  );
}

export default ProjectOpen;
