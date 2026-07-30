import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import type { Project } from "@repo/db";
import ControlPanel from "@/components/controlPanel";
import ProjectCreate from "@/components/projects/projectCreate";
import ProjectDelete from "@/components/projects/projectDelete";
import ProjectUpdate from "@/components/projects/projectUpdate";
import { useState } from "react";
import ProjectOpen from "@/components/projects/projectOpen";

function Workspace() {
  const { workspaceId } = useParams();
  const [selected, setSelected] = useState<number | undefined>();
  const { isPending, isError, error, data } = useQuery({
    queryKey: ["workspace", workspaceId],
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
              <ProjectOpen
                projectId={selected}
                workspaceId={Number(workspaceId)}
              />
              <ProjectUpdate
                projectId={selected}
                workspaceId={Number(workspaceId)}
              />
              <ProjectDelete
                setProjectId={setSelected}
                projectId={selected}
                workspaceId={Number(workspaceId)}
              />
            </>
          ) : null}
          <ProjectCreate workspaceId={Number(workspaceId)} />
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
