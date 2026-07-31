import type { User } from "@repo/db";
import { Outlet, useOutletContext, Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import type { Workspace } from "@repo/db";
import ControlPanel from "@/components/ControlPanel";
import WorkspaceCreate from "@/components/workspaces/WorkspaceCreate";
import WorkspaceDelete from "@/components/workspaces/WorkspaceDelete";
import WorkspaceUpdate from "@/components/workspaces/WorkspaceUpdate";

function Workspaces() {
  const { workspaceId } = useParams();
  const user = useOutletContext<Omit<User, "password">>();
  const { isPending, isError, error, data } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetchApi<Workspace[]>("/workspaces", "GET");
      if (!res.success) throw res.error;
      return res.data;
    },
  });

  return (
    <div className="px-4 w-full max-w-2xl">
      <h1 className="text-center font-bold text-3xl mb-8">
        Welcome, {user.firstName}!
      </h1>
      <section>
        <h2 className="font-bold text-2xl">Workspaces</h2>
        <div className="flex justify-end">
          <ControlPanel>
            {workspaceId ? (
              <>
                <WorkspaceUpdate workspaceId={Number(workspaceId)} />
                <WorkspaceDelete workspaceId={Number(workspaceId)} />
              </>
            ) : null}
            <WorkspaceCreate />
          </ControlPanel>
        </div>
        {isPending ? (
          <p>Loading...</p>
        ) : isError ? (
          <p>{error.message}</p>
        ) : (
          <ul>
            {data.map((workspace) => {
              return (
                <li key={workspace.id}>
                  <Link
                    to={`/workspaces/${workspace.id}`}
                    data-workspace-id={workspace.id}
                    className={
                      workspaceId && workspaceId === workspace.id.toString()
                        ? "text-blue-400"
                        : ""
                    }
                  >
                    {workspace.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {workspaceId && (
        <section>
          <h2 className="font-bold text-2xl mt-8">Projects</h2>
          <Outlet key={workspaceId} />
        </section>
      )}
    </div>
  );
}

export default Workspaces;
