import { useLoaderData } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import type { Project } from "@repo/db";
import ControlPanel from "@/components/ControlPanel";
import ProjectCreate from "@/components/projects/ProjectCreate";
import ProjectDelete from "@/components/projects/ProjectDelete";
import ProjectUpdate from "@/components/projects/ProjectUpdate";
import { useState } from "react";
import ProjectOpen from "@/components/projects/ProjectOpen";
import type { WorkspaceLoader } from "../routes";

function Workspace() {
  const { workspaceId } = useLoaderData<typeof WorkspaceLoader>();
  const [selected, setSelected] = useState<number | undefined>();
  const { isPending, isError, error, data } = useQuery({
    queryKey: ["workspace", String(workspaceId)],
    queryFn: async () => {
      const res = await fetchApi<Project[]>(
        `/workspaces/${workspaceId}/projects`,
        "GET",
      );
      if (!res.success) throw res.error;
      return res.data;
    },
    enabled: !!workspaceId,
  });

  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;
  return (
    <>
      <div className="flex justify-end">
        <ControlPanel>
          {selected ? (
            <>
              <ProjectOpen projectId={selected} workspaceId={workspaceId} />
              <ProjectUpdate projectId={selected} workspaceId={workspaceId} />
              <ProjectDelete
                setProjectId={setSelected}
                projectId={selected}
                workspaceId={workspaceId}
              />
            </>
          ) : null}
          <ProjectCreate workspaceId={workspaceId} />
        </ControlPanel>
      </div>
      {data.length === 0 ? (
        <p>This workspace has no projects. Create one to proceed.</p>
      ) : (
        <ul>
          {data.map((project) => {
            return (
              <li
                key={project.id}
                onClick={() => {
                  setSelected(project.id);
                }}
                className={
                  selected === project.id
                    ? "text-blue-400 hover:cursor-pointer"
                    : "hover:cursor-pointer"
                }
              >
                {project.name}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default Workspace;
